const axios = require("axios");
const Problem = require("../models/Problem");
const Contest = require("../models/Contest");
const codeforces = require("../config/codeforces");
const Submission = require("../models/Submission");

//Retry Logic for API Calls
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(`Failed after ${maxAttempts} attempts:`, error.message);
        throw error;
      }

      console.log(
        `Attempt ${attempt} failed, retrying in ${
          delay * Math.pow(2, attempt)
        }ms...`
      );
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt))
      );
    }
  }
};

//Fetch user information (user.info)
const getUserInfo = async (handle) => {
  return retry(async () => {
    try {
      const response = await codeforces.user.info({ handles: handle });
      return response.result[0];
    } catch (error) {
      console.error(`Error fetching user info for ${handle}:`, error.message);
      throw error;
    }
  });
};

// Fetch problemset problems and statistics (problemset.problems)
const getProblemsetProblems = async () => {
  return retry(async () => {
    try {
      const response = await codeforces.problemset.problems({});
      return response.result;
    } catch (error) {
      console.error("Error fetching problemset problems:", error.message);
      throw error;
    }
  });
};

// Sync problems from problemset.problems to MongoDB
const syncProblems = async () => {
  try {
    const cfProblemsResponse = await getProblemsetProblems();

    if (!cfProblemsResponse.problems || !cfProblemsResponse.problemStatistics) {
      throw new Error("Unexpected response format from Codeforces API");
    }

    const { problems: cfProblemList, problemStatistics } = cfProblemsResponse;

    // Map problem statistics (solvedCount) to problems
    const problemSolvedCountMap = new Map();
    problemStatistics.forEach((stat) => {
      problemSolvedCountMap.set(
        `${stat.contestId}${stat.index}`,
        stat.solvedCount
      );
    });

    const operations = cfProblemList.map((cfProblem) => {
      const filter = { contestId: cfProblem.contestId, index: cfProblem.index };
      const update = {
        problemId: `${cfProblem.contestId}${cfProblem.index}`,
        contestId: cfProblem.contestId,
        name: cfProblem.name,
        index: cfProblem.index,
        type: cfProblem.type || "PROGRAMMING",
        points: cfProblem.points || null,
        rating: cfProblem.rating || null,
        tags: cfProblem.tags
          ? cfProblem.tags.map((tag) => tag.toLowerCase().trim())
          : [],
        solvedCount:
          problemSolvedCountMap.get(
            `${cfProblem.contestId}${cfProblem.index}`
          ) || 0,
      };

      return {
        updateOne: {
          filter,
          update: { $set: update },
          upsert: true,
        },
      };
    });

    let newProblemsCount = 0;
    let updatedProblemsCount = 0;

    if (operations.length > 0) {
      const result = await Problem.bulkWrite(operations);
      newProblemsCount = result.upsertedCount || 0;
      updatedProblemsCount = result.modifiedCount || 0;
    }

    return {
      newProblemsCount,
      updatedProblemsCount,
      totalProblemsProcessed: cfProblemList.length,
    };
  } catch (error) {
    console.error("Failed to sync problems:", error);
    throw new Error(`Failed to sync problems: ${error.message}`);
  }
};

// Helper function to categorize contest names
const categorizeContestName = (name) => {
  if (!name) return "Other";
  const lowerName = name.toLowerCase();

  // More specific checks first
  if (
    lowerName.includes("educational codeforces round") &&
    lowerName.includes("rated for div. 2")
  )
    return "Educational Div. 2";
  if (lowerName.includes("educational codeforces round")) return "Educational";

  if (lowerName.includes("codeforces global round")) return "Global Round";
  if (
    lowerName.includes("codeforces round") &&
    lowerName.includes("div. 1 + div. 2")
  )
    return "Div. 1 + Div. 2";
  if (lowerName.includes("codeforces round") && lowerName.includes("div. 1"))
    return "Div. 1";
  if (lowerName.includes("codeforces round") && lowerName.includes("div. 2"))
    return "Div. 2";
  if (lowerName.includes("codeforces round") && lowerName.includes("div. 3"))
    return "Div. 3";
  if (lowerName.includes("codeforces round") && lowerName.includes("div. 4"))
    return "Div. 4";

  // Broader categories
  if (lowerName.includes("kotlin heroes")) return "Kotlin Heroes";
  if (lowerName.includes("icpc")) return "ICPC";
  if (lowerName.includes("technocup")) return "Technocup";
  if (lowerName.includes("good bye")) return "Good Bye";
  if (lowerName.includes("hello")) return "Hello";
  if (lowerName.includes("beta round")) return "Beta Round"; // Historical
  if (lowerName.includes("rockethon")) return "Rockethon";
  if (lowerName.includes("zepto")) return "ZeptoLab";
  if (lowerName.includes("vk cup")) return "VK Cup";
  if (lowerName.includes("yandex")) return "Yandex";

  // If it's a generic "Codeforces Round #XYZ", but didn't match a specific division
  if (lowerName.startsWith("codeforces round #")) return "CF Round General";

  if (lowerName.includes("gym") || lowerName.includes("training"))
    return "Gym/Training";

  return "Other"; // Default category
};

// Fetch contest list (contest.list)
const getContestList = async (gym = false) => {
  return retry(async () => {
    try {
      const response = await codeforces.contest.list({ gym });
      console.log(
        `[codeforcesService] Successfully fetched ${response.result.length} contests (gym=${gym}).`
      );
      return response.result;
    } catch (error) {
      console.error(`Error fetching contest list (gym=${gym}):`, error.message);
      throw error;
    }
  });
};

// Sync contests from contest.list to MongoDB
const syncContests = async () => {
  console.log("[codeforcesService] Starting contest synchronization process.");
  try {
    // Fetch regular and gym contests
    const regularContests = await getContestList(false);
    const gymContests = await getContestList(true);
    const cfContestList = [...regularContests, ...gymContests];

    if (!cfContestList || cfContestList.length === 0) {
      console.warn(
        "[codeforcesService] No contests returned from Codeforces API during sync."
      );
      return {
        newContestsCount: 0,
        updatedContestsCount: 0,
        totalContestsProcessed: 0,
      };
    }

    console.log(
      `[codeforcesService] Total contests fetched from API: ${cfContestList.length}`
    );

    const operations = cfContestList.map((cfContest) => {
      const filter = { contestId: cfContest.id };
      const update = {
        contestId: cfContest.id,
        name: cfContest.name,
        type: cfContest.type || "CF",
        phase: cfContest.phase || "FINISHED",
        durationSeconds: cfContest.durationSeconds || 0,
        startTimeSeconds: cfContest.startTimeSeconds || 0,
        frozen: cfContest.frozen || false,
        relativeTimeSeconds: cfContest.relativeTimeSeconds,
        preparedBy: cfContest.preparedBy,
        websiteUrl: cfContest.websiteUrl,
        description: cfContest.description,
        difficulty: cfContest.difficulty,
        kind: cfContest.kind,
        icpcRegion: cfContest.icpcRegion,
        country: cfContest.country,
        city: cfContest.city,
        season: cfContest.season,
        formatCategory: categorizeContestName(cfContest.name),
      };

      // Remove undefined fields to avoid setting null
      Object.keys(update).forEach(
        (key) => update[key] === undefined && delete update[key]
      );

      return {
        updateOne: {
          filter,
          update: { $set: update },
          upsert: true,
        },
      };
    });

    let newContestsCount = 0;
    let updatedContestsCount = 0;

    if (operations.length > 0) {
      console.log(
        `[codeforcesService] Performing bulkWrite for ${operations.length} contest operations.`
      );
      const result = await Contest.bulkWrite(operations, { ordered: false });
      newContestsCount = result.upsertedCount || 0;
      updatedContestsCount = result.modifiedCount || 0;
      console.log(
        `[codeforcesService] BulkWrite complete. New: ${newContestsCount}, Updated: ${updatedContestsCount}`
      );
    }

    // Link problems to contests
    console.log(
      "[codeforcesService] Starting process to link problems to their respective contests."
    );
    let linkedProblemContests = 0;
    for (const cfContest of cfContestList) {
      const contestProblems = await Problem.find({
        contestId: cfContest.id,
      }).select("_id");

      if (contestProblems.length > 0) {
        const problemIds = contestProblems.map((p) => p._id);

        // Check if update is necessary to avoid unnecessary writes
        const existingContest = await Contest.findOne({
          contestId: cfContest.id,
        }).select("problems");

        if (
          !existingContest ||
          existingContest.problems.length !== problemIds.length ||
          !existingContest.problems.every((pId, index) =>
            pId.equals(problemIds[index])
          )
        ) {
          await Contest.updateOne(
            { contestId: cfContest.id },
            { $set: { problems: problemIds } }
          );
          linkedProblemContests++;
        }
      }
    }
    console.log(
      `[codeforcesService] Finished linking problems for ${linkedProblemContests} contests that had associated problems.`
    );

    return {
      newContestsCount,
      updatedContestsCount,
      totalContestsProcessed: cfContestList.length,
    };
  } catch (error) {
    console.error(
      "[codeforcesService] Error during contest synchronization:",
      error.message,
      error.stack
    );
    throw new Error(`Failed to sync contests: ${error.message}`);
  }
};

// Fetch all submissions for a user
const getUserSubmissions = async (handle) => {
  if (!handle) {
    throw new Error("Codeforces handle is required to fetch user submissions.");
  }

  // Fetch a large number of submissions.
  const submissionCountToFetch = 20000;
  console.log(
    `Fetching up to ${submissionCountToFetch} submissions for user: ${handle}`
  );

  return retry(async () => {
    try {
      const response = await codeforces.user.status({
        handle,
        from: 1,
        count: submissionCountToFetch,
      });

      console.log(
        `Successfully fetched ${response.result.length} submissions for ${handle}.`
      );
      return response.result; // This is an array of submission objects
    } catch (error) {
      console.error(`Error fetching submissions for ${handle}:`, error.message);
      throw error;
    }
  });
};

// Get a Set of solved problem IDs for a user
const getUserSolvedProblemIds = async (handle) => {
  if (!handle) {
    throw new Error("Codeforces handle is required to get solved problem IDs.");
  }

  const submissions = await getUserSubmissions(handle);
  const solvedProblemIds = new Set();

  if (!submissions || submissions.length === 0) {
    console.log(`No submissions found for user ${handle}.`);
    return solvedProblemIds;
  }

  submissions.forEach((submission) => {
    if (submission.verdict === "OK") {
      if (
        submission.problem &&
        typeof submission.problem.contestId !== "undefined" &&
        submission.problem.index
      ) {
        const problemIdString = `${submission.problem.contestId}${submission.problem.index}`;
        solvedProblemIds.add(problemIdString);
      } else {
        console.warn(
          "Found 'OK' submission with missing problem details:",
          submission
        );
      }
    }
  });

  console.log(
    `User ${handle} has ${solvedProblemIds.size} unique solved problems.`
  );
  return solvedProblemIds;
};

// Fetches user's recent submissions from Codeforces and syncs them with a practice contest.
const syncSubmissionsForPracticeContest = async (
  codeforcesHandle,
  practiceContest
) => {
  try {
    // 1. Fetch user's last 50 submissions from Codeforces API
    const cfSubmissionsResponse = await codeforces.user.status({
      handle: codeforcesHandle,
      from: 1,
      count: 50, // A reasonable number to check for recent activity
    });

    const cfSubmissions = cfSubmissionsResponse.result;

    // 2. Prepare for efficient matching
    // Create a map of problem identifiers ('contestId-index') to the problem object in our contest
    const contestProblemMap = new Map();
    practiceContest.problems.forEach((p) => {
      const problemIdentifier = `${p.problem.contestId}-${p.problem.index}`;
      contestProblemMap.set(problemIdentifier, p);
    });

    let newSubmissionsCount = 0;
    const updatedProblemIds = new Set();

    // 3. Process submissions from oldest to newest to get the correct first solve time
    for (const cfSub of cfSubmissions.reverse()) {
      const problemIdentifier = `${cfSub.problem.contestId}-${cfSub.problem.index}`;

      // Check if this submission is for a problem in our contest
      if (contestProblemMap.has(problemIdentifier)) {
        // Check if we have already synced this submission
        const existingSubmission = await Submission.findOne({
          submissionCfId: cfSub.id,
        });

        if (!existingSubmission) {
          newSubmissionsCount++;
          // This is a new, relevant submission. Let's save it.
          const newDbSubmission = new Submission({
            submissionCfId: cfSub.id,
            practiceContest: practiceContest._id,
            user: practiceContest.user,
            problem: contestProblemMap.get(problemIdentifier).problem._id,
            language: cfSub.programmingLanguage,
            verdict: cfSub.verdict, // Store the raw CF verdict
          });
          await newDbSubmission.save();

          // If it's an "OK" verdict, update the parent contest
          if (cfSub.verdict === "OK") {
            const problemInContest = contestProblemMap.get(problemIdentifier);
            // Only update if it wasn't already marked as solved
            if (!problemInContest.solved) {
              problemInContest.solved = true;
              const solveTime =
                cfSub.creationTimeSeconds -
                Math.floor(practiceContest.startTime.getTime() / 1000);
              problemInContest.userSolveTimeSeconds = Math.max(0, solveTime); // Ensure not negative
              updatedProblemIds.add(problemInContest.problem._id.toString());
            }
          }
        }
      }
    }

    // 4. Save the changes to the practice contest if any problems were updated
    if (updatedProblemIds.size > 0) {
      await practiceContest.save();
    }

    return {
      newSubmissionsCount,
      updatedProblemsCount: updatedProblemIds.size,
    };
  } catch (error) {
    console.error(
      `Error syncing submissions for ${codeforcesHandle}:`,
      error.message
    );
    throw error;
  }
};

// Fetch user's contest history from Codeforces API
const getUserContestHistory = async (handle) => {
  if (!handle) {
    throw new Error("Codeforces handle is required to fetch contest history.");
  }

  return retry(async () => {
    try {
      const response = await codeforces.user.rating({ handle });
      console.log(
        `Successfully fetched ${response.result.length} contests for ${handle}.`
      );

      // Get contest details for each contest the user participated in
      const contestIds = response.result.map((entry) => entry.contestId);
      const contestDetailsMap = new Map();

      if (contestIds.length > 0) {
        // Fetch all contests
        const allContests = await getContestList(false);

        // Create a map for quick lookup
        allContests.forEach((contest) => {
          contestDetailsMap.set(contest.id, contest);
        });
      }

      // Enhance the contest history with more details
      const enhancedHistory = response.result.map((entry) => {
        const contestDetails = contestDetailsMap.get(entry.contestId) || {};
        return {
          ...entry,
          contestName: contestDetails.name || `Contest #${entry.contestId}`,
          durationSeconds: contestDetails.durationSeconds || 0,
          startTimeSeconds:
            contestDetails.startTimeSeconds || entry.ratingUpdateTimeSeconds,
          type: contestDetails.type || "CF",
        };
      });

      // Sort by ratingUpdateTimeSeconds in descending order to get most recent first
      enhancedHistory.sort(
        (a, b) => b.ratingUpdateTimeSeconds - a.ratingUpdateTimeSeconds
      );

      return enhancedHistory;
    } catch (error) {
      console.error(
        `Error fetching contest history for ${handle}:`,
        error.message
      );
      throw error;
    }
  });
};

module.exports = {
  getUserInfo,
  getProblemsetProblems,
  syncProblems,
  getContestList,
  syncContests,
  getUserSubmissions,
  getUserSolvedProblemIds,
  syncSubmissionsForPracticeContest,
  getUserContestHistory,
};
