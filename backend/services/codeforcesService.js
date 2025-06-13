const axios = require("axios");

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

module.exports = { getUserInfo };
