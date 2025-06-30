const User = require("../models/User");
const codeforcesService = require("../services/codeforcesService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  const { codeforcesHandle, email, password } = req.body;

  //custom validation
  if (!codeforcesHandle || !email || !password) {
    return res.status(400).json({ message: "Please enter all fields" });
  }
  try {
    //check if cfHandle or email already exists
    const existingUser = await User.findOne({
      $or: [{ codeforcesHandle }, { email }],
    });
    if (existingUser) {
      if (existingUser.codeforcesHandle === codeforcesHandle) {
        return res.status(400).json({
          message: `User with Codeforces handle ${codeforcesHandle} already exists!`,
        });
      }

      if (existingUser.email === email) {
        return res.status(400).json({
          message: `User with email ${email} already exists!`,
        });
      }
    }

    //get rating and maxRating using API call in codeforcesService
    let cfData;
    try {
      cfData = await codeforcesService.getUserInfo(codeforcesHandle);
    } catch (cfError) {
      if (
        cfError.message &&
        cfError.message.toLowerCase().includes("not found")
      ) {
        return res.status(400).json({
          message: `Codeforces user handle '${codeforcesHandle}' not found or API error.`,
        });
      }
      console.error(
        "Codeforces API error during registration:",
        cfError.message
      );
      return res.status(502).json({
        message:
          "Failed to retrieve Codeforces user information due to an external service error.",
      });
    }

    // Fetch the user's solved problems from Codeforces
    let solvedProblems = [];
    try {
      // Import the user solved problems function
      const getUserSolvedProblemIds =
        require("../services/codeforcesService").getUserSolvedProblemIds;
      const solvedProblemSet = await getUserSolvedProblemIds(codeforcesHandle);
      solvedProblems = Array.from(solvedProblemSet); // Convert Set to Array
      console.log(
        `Fetched ${solvedProblems.length} solved problems for new user ${codeforcesHandle}`
      );
    } catch (error) {
      console.error(
        `Error fetching solved problems for ${codeforcesHandle}:`,
        error.message
      );
      // Continue with registration even if we can't fetch solved problems
    }

    //create new user
    const newUser = new User({
      codeforcesHandle,
      email,
      password,
      codeforcesRating: cfData.rating || 0,
      maxRating: cfData.maxRating || 0,
      avatar: cfData.avatar || null,
      titlePhoto: cfData.titlePhoto || null,
      solvedProblems: solvedProblems, // Add solved problems to new user
    });

    //hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    //save user
    await newUser.save();

    //creating JWT token
    const payload = {
      user: {
        id: newUser.id,
        role: newUser.role,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      token,
      user: {
        // Send comprehensive user info back
        id: newUser.id,
        email: newUser.email,
        codeforcesHandle: newUser.codeforcesHandle,
        codeforcesRating: newUser.codeforcesRating || 0,
        maxRating: newUser.maxRating || 0,
        avatar: newUser.avatar,
        titlePhoto: newUser.titlePhoto,
        rank: cfData.rank,
        maxRank: cfData.maxRank,
        solvedProblems: solvedProblems, // Return the actual solved problems array
        practiceContestHistory: [],
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Server error during registration:", error.message);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// @desc    Authenticate user & get token (login)
// @route   POST /api/auth/login
const login = async (req, res) => {
  const { email, codeforcesHandle, password } = req.body;

  //custom validation -> one of email or cfHandle must be present
  if (!(email || codeforcesHandle) || !password) {
    return res.status(400).json({
      message:
        "Please provide credentials (email or Codeforces handle) and password",
    });
  }
  try {
    //check if user exists
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (codeforcesHandle) {
      user = await User.findOne({ codeforcesHandle });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    //validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Try to get fresh CF data if possible
    let cfData = null;
    let solvedProblems = user.solvedProblems || [];

    try {
      cfData = await codeforcesService.getUserInfo(user.codeforcesHandle);

      // Also try to get latest solved problems
      try {
        const solvedProblemSet =
          await codeforcesService.getUserSolvedProblemIds(
            user.codeforcesHandle
          );
        solvedProblems = Array.from(solvedProblemSet); // Convert Set to Array
        console.log(
          `Login - Fetched ${solvedProblems.length} solved problems for ${user.codeforcesHandle}`
        );

        // Update the user with the latest solved problems
        if (
          solvedProblems.length > 0 &&
          (!user.solvedProblems ||
            solvedProblems.length !== user.solvedProblems.length)
        ) {
          user.solvedProblems = solvedProblems;
          await user.save();
          console.log(
            `Updated user's solved problems in database during login`
          );
        }
      } catch (solvedError) {
        console.error(
          `Error fetching solved problems during login:`,
          solvedError.message
        );
        // Use existing solved problems if we can't fetch the latest
      }
    } catch (error) {
      console.log("Could not fetch fresh CF data during login:", error.message);
    }

    //creating JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      token,
      user: {
        // Send comprehensive user info back
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        country: user.country,
        codeforcesHandle: user.codeforcesHandle,
        codeforcesRating: cfData?.rating || user.codeforcesRating || 0,
        maxRating: cfData?.maxRating || user.maxRating || 0,
        avatar: cfData?.avatar || user.avatar,
        titlePhoto: cfData?.titlePhoto || user.titlePhoto,
        rank: cfData?.rank,
        maxRank: cfData?.maxRank,
        solvedProblems: solvedProblems,
        practiceContestHistory: user.practiceContestHistory || [],
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Server error during login:", error.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

// @desc    Get logged in user data
// @route   GET /api/auth/user
const getUser = async (req, res) => {
  try {
    //find the user
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("GetUser - User found:", user._id, "Role:", user.role);

    // Try to get fresh CF data if possible
    let cfData = null;
    let solvedProblems = user.solvedProblems || [];

    try {
      cfData = await codeforcesService.getUserInfo(user.codeforcesHandle);

      // Also try to get latest solved problems
      try {
        const solvedProblemSet =
          await codeforcesService.getUserSolvedProblemIds(
            user.codeforcesHandle
          );
        solvedProblems = Array.from(solvedProblemSet); // Convert Set to Array
        console.log(
          `getUser - Fetched ${solvedProblems.length} solved problems for ${user.codeforcesHandle}`
        );

        // Update the user with the latest solved problems
        if (
          solvedProblems.length > 0 &&
          (!user.solvedProblems ||
            solvedProblems.length !== user.solvedProblems.length)
        ) {
          user.solvedProblems = solvedProblems;
          await user.save();
          console.log(
            `Updated user's solved problems in database during getUser`
          );
        }
      } catch (solvedError) {
        console.error(
          `Error fetching solved problems during getUser:`,
          solvedError.message
        );
        // Use existing solved problems if we can't fetch the latest
      }
    } catch (error) {
      console.log(
        "Could not fetch fresh CF data during getUser:",
        error.message
      );
    }

    // Create a comprehensive response with all available data
    const userData = {
      ...user.toObject(),

      // Include potentially fresher CF data if available
      codeforcesRating: cfData?.rating || user.codeforcesRating || 0,
      maxRating: cfData?.maxRating || user.maxRating || 0,
      avatar: cfData?.avatar || user.avatar,
      titlePhoto: cfData?.titlePhoto || user.titlePhoto,
      rank: cfData?.rank,
      maxRank: cfData?.maxRank,

      // Ensure arrays are always defined with the latest data
      solvedProblems: solvedProblems,
      practiceContestHistory: user.practiceContestHistory || [],

      // Include any additional CF data that might be useful
      contribution: cfData?.contribution,
      friendOfCount: cfData?.friendOfCount,
      lastOnlineTimeSeconds: cfData?.lastOnlineTimeSeconds,
      registrationTimeSeconds: cfData?.registrationTimeSeconds,
    };

    // Log user data being sent to verify role is included
    console.log("GetUser - Sending userData with role:", userData.role);

    res.json(userData);
  } catch (error) {
    console.error("Server error while getting user:", error.message);
    res.status(500).json({ message: "Server error while getting user." });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  //we do not remove the token as it will expire after specified time
  //if we want, we can remove the token from local storage when logout button is clicked in frontend
  res.json({ message: "User logged out successfully" });
};

// @desc    Update user's Codeforces data including avatar
// @route   PUT /api/auth/update-cf-data
const updateCodeforcesData = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch latest data from Codeforces API
    try {
      const cfData = await codeforcesService.getUserInfo(user.codeforcesHandle);

      // Update user data
      user.codeforcesRating = cfData.rating || user.codeforcesRating;
      user.maxRating = cfData.maxRating || user.maxRating;
      user.avatar = cfData.avatar || user.avatar;
      user.titlePhoto = cfData.titlePhoto || user.titlePhoto;

      // Fetch the user's latest solved problems
      try {
        const solvedProblemSet =
          await codeforcesService.getUserSolvedProblemIds(
            user.codeforcesHandle
          );
        const solvedProblems = Array.from(solvedProblemSet); // Convert Set to Array
        console.log(
          `Updated solved problems for ${user.codeforcesHandle}: ${solvedProblems.length} problems`
        );
        user.solvedProblems = solvedProblems;
      } catch (solvedError) {
        console.error(
          `Error updating solved problems for ${user.codeforcesHandle}:`,
          solvedError.message
        );
        // Continue with the update even if we can't fetch solved problems
      }

      await user.save();

      // Return comprehensive user data
      res.json({
        message: "Codeforces data updated successfully",
        // User model data
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        country: user.country,
        codeforcesHandle: user.codeforcesHandle,
        role: user.role,
        solvedProblems: user.solvedProblems || [],
        practiceContestHistory: user.practiceContestHistory || [],

        // Updated CF data
        codeforcesRating: user.codeforcesRating,
        maxRating: user.maxRating,
        avatar: user.avatar,
        titlePhoto: user.titlePhoto,

        // Additional CF data
        rank: cfData.rank,
        maxRank: cfData.maxRank,
        contribution: cfData.contribution,
        friendOfCount: cfData.friendOfCount,
        lastOnlineTimeSeconds: cfData.lastOnlineTimeSeconds,
        registrationTimeSeconds: cfData.registrationTimeSeconds,

        // Meta information
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating Codeforces data:", error.message);
      res.status(500).json({ message: "Failed to update Codeforces data" });
    }
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, getUser, logout, updateCodeforcesData };
