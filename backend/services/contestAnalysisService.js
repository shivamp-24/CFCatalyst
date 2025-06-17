const codeforcesService = require("../services/codeforcesService");
const Problem = require("../models/Problem");
const Contest = require("../models/Contest");

// Identifies tags of problems that the user has attempted but not yet solved,
// ordered by frequency of attempts on those tags.

const identifyUserWeakTags = async (userCodeforcesHandle) => {
  console.log(
    `[contestAnalysisService] Identifying weak tags for ${userCodeforcesHandle}`
  );

  if (!userCodeforcesHandle) {
    throw new Error(
      "[contestAnalysisService] userCodeforcesHandle is required."
    );
  }

  // 1. Get all user submissions
  const allSubmissions = await codeforcesService.getUserSubmissions(
    userCodeforcesHandle
  );
  if (!allSubmissions || allSubmissions.length === 0) {
    console.log(
      `[contestAnalysisService] No submissions found for ${userCodeforcesHandle}. Cannot identify weak tags.`
    );
    return [];
  }

  // 2. Get IDs of problems the user has ALREADY solved
  const solvedProblemIds = await codeforcesService.getUserSolvedProblemIds(
    userCodeforcesHandle
  );
  console.log(
    `[contestAnalysisService] User has solved ${solvedProblemIds.size} problems.`
  );

  // 3. Filter for non-"OK" submissions for problems the user HASN'T solved yet.
  //    And collect unique problem identifiers for these attempts.
  const attemptedUnsolvedProblemIdentifiers = new Map(); // Key: problemIdString

  allSubmissions.forEach((submission) => {
    if (
      submission.verdict !== "OK" &&
      submission.problem &&
      typeof submission.problem.contestId !== "undefined" &&
      submission.problem.index
    ) {
      const problemIdString = `${submission.problem.contestId}${submission.problem.index}`;

      // Only consider this problem if it's NOT in the set of already solved problems
      if (!solvedProblemIds.has(problemIdString)) {
        if (!attemptedUnsolvedProblemIdentifiers.has(problemIdString)) {
          attemptedUnsolvedProblemIdentifiers.set(problemIdString, {
            contestId: submission.problem.contestId,
            index: submission.problem.index,
          });
        }
      }
    }
  });

  if (attemptedUnsolvedProblemIdentifiers.size === 0) {
    console.log(
      `[contestAnalysisService] No attempted but unsolved problems found for ${userCodeforcesHandle}.`
    );
    return [];
  }

  console.log(
    `[contestAnalysisService] Found ${attemptedUnsolvedProblemIdentifiers.size} unique attempted but unsolved problems.`
  );

  // 4. Fetch tags for these unique attempted-but-unsolved problems from our DB
  const problemIdStringsToFetch = Array.from(
    attemptedUnsolvedProblemIdentifiers.keys()
  );

  // Query our local Problem database for these problems
  const problemsFromDb = await Problem.find({
    problemId: { $in: problemIdStringsToFetch },
  }).select("tags problemId");

  // 5. Aggregate tags and count their frequency
  const tagFrequency = new Map(); // Key: tag, Value: count of distinct problems

  problemsFromDb.forEach((dbProblem) => {
    if (dbProblem.tags && dbProblem.tags.length > 0) {
      // Use a Set to count each tag only once per problem, even if a problem has ["dp", "dp"]
      const uniqueTagsForProblem = new Set(
        dbProblem.tags.map((tag) => tag.toLowerCase().trim())
      );
      uniqueTagsForProblem.forEach((tag) => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    }
  });

  if (tagFrequency.size === 0) {
    console.log(
      `[contestAnalysisService] No tags found for the attempted but unsolved problems.`
    );
    return [];
  }

  // 6. Sort tags by frequency (descending)
  const sortedWeakTags = Array.from(tagFrequency.entries())
    .map(([tag, count]) => ({ tag, attemptsOnDistinctProblems: count }))
    .sort(
      (a, b) => b.attemptsOnDistinctProblems - a.attemptsOnDistinctProblems
    );

  console.log(
    `[contestAnalysisService] Identified weak tags for ${userCodeforcesHandle}:`,
    sortedWeakTags
  );
  return sortedWeakTags;
};

const MAX_CONTESTS_FOR_PROFILE = 50; // Analyze up to last N finished contests of this type for relevance
const MIN_PROBLEMS_IN_CONTEST_FOR_ANALYSIS = 3; // Ignore contests with too few problems for profile generation
const MAX_TAGS_PER_INDEX_PROFILE = 5; // Max common tags to store per problem index in profile
const MAX_OVERALL_TAGS_PROFILE = 15; // Max overall common tags to store in profile

// Analyzes historical contests of a specific format to generate a profile.
// The profile includes average ratings per problem index, overall common tags,
// and common tags per problem index.

const getContestProfile = async (targetContestFormat) => {
  console.log(
    `[contestAnalysisService] Generating profile for contest format: ${targetContestFormat}`
  );

  if (!targetContestFormat) {
    throw new Error(
      "[contestAnalysisService] targetContestFormat is required."
    );
  }

  // 1. Fetch recent, finished contests of the target format that have problems linked.
  // We sort by startTimeSeconds descending to get recent contests.
  // We only consider contests that are FINISHED.
  const contests = await Contest.find({
    formatCategory: targetContestFormat,
    phase: "FINISHED",
    "problems.0": { $exists: true }, // Ensures the 'problems' array is not empty
  })
    .sort({ startTimeSeconds: -1 }) // Get most recent ones
    .limit(MAX_CONTESTS_FOR_PROFILE)
    .populate({
      path: "problems",
      select: "rating tags index problemId", // Select necessary fields from Problem model
      options: { sort: { index: 1 } }, // Sort problems by their index (A, B, C...)
    });

  if (!contests || contests.length === 0) {
    console.warn(
      `[contestAnalysisService] No finished contests found for format: ${targetContestFormat}`
    );
    return null;
  }

  const validContestsForAnalysis = contests.filter(
    (c) =>
      c.problems && c.problems.length >= MIN_PROBLEMS_IN_CONTEST_FOR_ANALYSIS
  );

  if (validContestsForAnalysis.length === 0) {
    console.warn(
      `[contestAnalysisService] Not enough valid contests (min ${MIN_PROBLEMS_IN_CONTEST_FOR_ANALYSIS} problems) found for format: ${targetContestFormat} after filtering.`
    );
    return null;
  }

  console.log(
    `[contestAnalysisService] Analyzing ${validContestsForAnalysis.length} contests for format: ${targetContestFormat}`
  );

  // 2. Calculate average rating per problem index and aggregate overall tags
  const ratingSumPerIndex = {}; // { 'A': { sum: 5000, count: 5 }, 'B': { sum: 6000, count: 5 } }
  const overallTagFrequency = new Map(); // { 'dp': 10, 'graphs': 8 }
  const tagsPerIndexFrequency = {}; // Object to hold Maps: { 'A': Map<tag, count>, 'B': Map<tag, count> }

  validContestsForAnalysis.forEach((contest) => {
    contest.problems.forEach((problem) => {
      const problemIndex = problem.index; // e.g., 'A', 'B'
      const problemRating = problem.rating;
      const problemTags = problem.tags;

      if (problemIndex && typeof problemRating === "number") {
        // Average Rating Per Index
        if (!ratingSumPerIndex[problemIndex]) {
          ratingSumPerIndex[problemIndex] = { sum: 0, count: 0 };
        }
        ratingSumPerIndex[problemIndex].sum += problemRating;
        ratingSumPerIndex[problemIndex].count += 1;
      }

      if (problemTags && problemTags.length > 0) {
        const uniqueTagsForProblem = new Set(
          problemTags.map((tag) => tag.toLowerCase().trim())
        );

        // Overall Common Tags
        uniqueTagsForProblem.forEach((tag) => {
          overallTagFrequency.set(tag, (overallTagFrequency.get(tag) || 0) + 1);
        });

        // Common Tags Per Index
        if (problemIndex) {
          // Ensure problemIndex exists
          if (!tagsPerIndexFrequency[problemIndex]) {
            tagsPerIndexFrequency[problemIndex] = new Map();
          }
          uniqueTagsForProblem.forEach((tag) => {
            const currentMapForIndex = tagsPerIndexFrequency[problemIndex];
            currentMapForIndex.set(tag, (currentMapForIndex.get(tag) || 0) + 1);
          });
        }
      }
    });
  });

  // Finalize average ratings
  const averageRatingPerIndex = {};
  for (const index in ratingSumPerIndex) {
    averageRatingPerIndex[index] = Math.round(
      ratingSumPerIndex[index].sum / ratingSumPerIndex[index].count
    );
  }

  // Finalize and sort overall common tags
  const overallCommonTags = Array.from(overallTagFrequency.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_OVERALL_TAGS_PROFILE);

  // Finalize and sort commonTagsPerIndex
  const commonTagsPerIndexResult = {};
  for (const index in tagsPerIndexFrequency) {
    commonTagsPerIndexResult[index] = Array.from(
      tagsPerIndexFrequency[index].entries()
    )
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_TAGS_PER_INDEX_PROFILE); // Get top N tags for this specific index
  }

  const profile = {
    targetFormat: targetContestFormat,
    contestsAnalyzed: validContestsForAnalysis.length,
    averageRatingPerIndex,
    overallCommonTags,
    commonTagsPerIndex: commonTagsPerIndexResult,
  };

  console.log(
    `[contestAnalysisService] Profile generated for ${targetContestFormat}:`,
    JSON.stringify(profile, null, 2)
  );
  return profile;
};

module.exports = { identifyUserWeakTags, getContestProfile };
