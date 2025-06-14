const axios = require("axios");
const Problem = require("../models/Problem");

// Configure axios instance with timeout and rate limit handling
const apiClient = axios.create({
  baseURL: process.env.CODEFORCES_API_URL,
  timeout: 5000, // 5 seconds timeout
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

module.exports = { getUserInfo, getProblemsetProblems, syncProblems };
