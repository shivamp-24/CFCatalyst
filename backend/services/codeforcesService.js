const axios = require("axios");
const Problem = require("../models/Problem");
const Contest = require("../models/Contest");

// Configure axios instance with timeout and rate limit handling
const apiClient = axios.create({
  baseURL: process.env.CODEFORCES_API_URL,
  timeout: 30 * 1000, // 30 seconds timeout
});

//Retry Logic for API Calls
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt == maxAttempts || error.response?.status !== 429) {
        throw error;
      }

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
    const response = await apiClient.get(
      `/user.info?handles=${encodeURIComponent(handle)}`
    );
    if (response.data.status !== "OK") {
      throw new Error(`Codeforces API error: ${response.data.comment}`);
    }
    return response.data.result[0];
  });
};

// Fetch problemset problems and statistics (problemset.problems)
const getProblemsetProblems = async () => {
  return retry(async () => {
    const response = await apiClient.get("/problemset.problems");

    if (response.data.status !== "OK") {
      throw new Error(`Codeforces API error: ${response.data.comment}`);
    }
    return response.data.result;
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
    throw new Error(`Failed to sync problems: ${error.message}`);
  }
};

// Fetch contest list (contest.list)
const getContestList = async (gym = false) => {
  return retry(async () => {
    const response = await apiClient.get(`/contest.list?gym=${gym}`);
    if (response.data.status !== "OK") {
      throw new Error(
        `Codeforces API error for contest.list: ${response.data.comment}`
      );
    }

    return response.data.result;
  });
};

// Sync contests from contest.list to MongoDB
const syncContests = async (req, res) => {
  try {
    // Fetch regular and gym contests
    const regularContests = await getContestList(false);
    const gymContests = await getContestList(true);
    const cfContestList = [...regularContests, ...gymContests];

    if (!cfContestList || cfContestList.length === 0) {
      throw new Error("No contests returned from Codeforces API");
    }

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
      const result = await Contest.bulkWrite(operations, { ordered: false });
      newContestsCount = result.upsertedCount || 0;
      updatedContestsCount = result.modifiedCount || 0;
    }

    // Link problems to contests
    for (const cfContest of cfContestList) {
      const contestProblems = await Problem.find({ contestId: cfContest.id });
      if (contestProblems.length > 0) {
        await Contest.updateOne(
          { contestId: cfContest.id },
          { $set: { problems: contestProblems.map((p) => p._id) } }
        );
      }
    }

    return {
      newContestsCount,
      updatedContestsCount,
      totalContestsProcessed: cfContestList.length,
    };
  } catch (error) {
    throw new Error(`Failed to sync contests: ${error.message}`);
  }
};

module.exports = {
  getUserInfo,
  getProblemsetProblems,
  syncProblems,
  getContestList,
  syncContests,
};
