const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config(); // To load environment variables from .env file

const API_KEY = process.env.CODEFORCES_API_KEY;
const API_SECRET = process.env.CODEFORCES_API_SECRET;
const BASE_URL = process.env.CODEFORCES_API_URL;

// Makes a request to the Codeforces API.
// Handles the creation of the apiSig for authenticated requests if key/secret are provided.
const makeApiRequest = async (methodName, params = {}) => {
  // Add API key and current time to parameters if a key is available
  if (API_KEY) {
    params.apiKey = API_KEY;
    params.time = Math.floor(Date.now() / 1000);
  }

  // Sort parameters alphabetically by key to create the parameter string
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const url = `${BASE_URL}/${methodName}?${sortedParams}`;
  let finalUrl = url;

  if (API_KEY && API_SECRET) {
    const rand = Math.random().toString(36).substring(2, 8); // 6-character random string
    const sigString = `${rand}/${methodName}?${sortedParams}#${API_SECRET}`;
    const apiSig = crypto.createHash("sha512").update(sigString).digest("hex");
    finalUrl = `${url}&apiSig=${rand}${apiSig}`;
  }

  try {
    const response = await axios.get(finalUrl);

    if (response.data.status === "OK") {
      return response.data; // Return the full response object
    } else {
      // Handle cases where the API returns a FAILED status
      console.error(
        `Codeforces API error for method ${methodName}:`,
        response.data.comment
      );
      throw new Error(
        `Codeforces API request failed: ${response.data.comment}`
      );
    }
  } catch (error) {
    console.error(
      `Error calling Codeforces API method ${methodName}:`,
      error.message
    );
    // Re-throw the error so the calling service can handle it
    throw error;
  }
};

// Structure the export to mirror the Codeforces API structure for clean calls
const codeforces = {
  user: {
    status: (params) => makeApiRequest("user.status", params),
    info: (params) => makeApiRequest("user.info", params),
    rating: (params) => makeApiRequest("user.rating", params),
  },
  problemset: {
    problems: (params) => makeApiRequest("problemset.problems", params),
  },
  contest: {
    list: (params) => makeApiRequest("contest.list", params),
  },
};

module.exports = codeforces;
