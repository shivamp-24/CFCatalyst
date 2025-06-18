const PracticeContest = require("../models/PracticeContest");
const User = require("../models/User");
const codeforcesService = require("../services/codeforcesService");

// @desc    Get user profile by Codeforces handle
// @route   GET /api/users/profile/:codeforcesHandle
const getProfile = async (req, res) => {
  const { codeforcesHandle } = req.params;

  try {
    //first try to find user in database
    let user = await User.findOne({ codeforcesHandle }).select("-password");

    if (user) {
      //merge info with cfData
      const cfData = await codeforcesService.getUserInfo(codeforcesHandle);
      const profileData = { ...user.toObject(), ...cfData };
      return res.json(profileData);
    } else {
      // user not found in DB -> fetch from CF API
      const cfData = await codeforcesService.getUserInfo(codeforcesHandle);
      if (cfData) {
        return res.json({
          codeforcesHandle: cfData.handle, // CF API uses 'handle'
          codeforcesRating: cfData.rating,
          maxRating: cfData.maxRating,
          rank: cfData.rank,
          maxRank: cfData.maxRank,
          avatar: cfData.avatar,
        });
      } else {
        return res
          .status(404)
          .json({ message: `User profile for ${codeforcesHandle} not found.` });
      }
    }
  } catch (error) {
    console.error(
      `Error fetching profile for ${codeforcesHandle}:`,
      error.message
    );
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// @desc    Update authenticated user's profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  const { email, name, bio, country, role } = req.body;
  const userId = req.user.id; // From authMiddleware

  try {
    //find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    //update allowed fields
    if (email) {
      //check if email is not taken by any other user
      const emailExists = await User.findOne({
        email: email,
        _id: { $ne: userId },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ message: "Email is already in use by another account." });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    if (bio) {
      user.bio = bio;
    }

    if (country) {
      user.country = country;
    }

    if (role) {
      user.role = role;
    }

    const updatedUser = await user.save();
    const userResponse = updatedUser.toObject();
    delete userResponse.password; // Ensure password is not sent back

    res.json(userResponse);
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error.message);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

// @desc    Get authenticated user's Codeforces stats (and potentially sync)
// @route   GET /api/users/me/cf-stats
const getCFStats = async (req, res) => {
  const userId = req.user.id; // From authMiddleware

  try {
    //find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    //fetch latest stats from CF API
    const cfData = await codeforcesService.getUserInfo(user.codeforcesHandle);

    if (cfData) {
      // update local db if stats have changed
      let updatedInDb = false;
      if (
        user.codeforcesRating !== cfData.rating ||
        user.maxRating !== cfData.maxRating
      ) {
        user.codeforcesRating = cfData.rating;
        user.maxRating = cfData.maxRating;
        await user.save();
        updatedInDb = true;
      }

      res.json({
        codeforcesHandle: user.codeforcesHandle,
        currentRating: cfData.rating,
        maxRating: cfData.maxRating,
        rank: cfData.rank,
        maxRank: cfData.maxRank,
        lastOnlineTimeSeconds: cfData.lastOnlineTimeSeconds,
        friendOfCount: cfData.friendOfCount,
        source: "Codeforces API",
        updatedInLocalDB: updatedInDb,
        localDataLastChecked: new Date().toISOString(),
      });
    } else {
      return res
        .status(502)
        .json({ message: "Could not retrieve stats from Codeforces API." });
    }
  } catch (error) {
    console.error(`Error fetching CF stats for user ${userId}:`, error.message);
    res
      .status(500)
      .json({ message: "Server error while fetching Codeforces stats." });
  }
};

// @desc    Get authenticated user's practice contest history
// @route   GET /api/users/me/practice-history
const getPracticeHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const practiceContests = await PracticeContest.find({
      user: userId,
    })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .populate("problems.problem", "problemId name rating tags")
      .populate("leaderboard", "user score penalty rank");

    return res.json(practiceContests);
  } catch (error) {
    console.error(
      `Error fetching practice history for user ${userId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while fetching practice history." });
  }
};

module.exports = { getProfile, updateProfile, getCFStats, getPracticeHistory };
