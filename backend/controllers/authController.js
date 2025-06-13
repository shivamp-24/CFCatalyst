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

    //create new user
    const newUser = new User({
      codeforcesHandle,
      email,
      password,
      codeforcesRating: cfData.rating || 0,
      maxRating: cfData.maxRating || 0,
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
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      token,
      user: {
        // Send some basic user info back
        id: newUser.id,
        email: newUser.email,
        codeforcesHandle: newUser.codeforcesHandle,
        codeforcesRating: newUser.codeforcesRating,
        maxRating: newUser.maxRating,
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

    //creating JWT token
    const payload = {
      user: {
        id: user.id,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      token,
      user: {
        // Send some basic user info back
        id: user.id,
        email: user.email,
        codeforcesHandle: user.codeforcesHandle,
        codeforcesRating: user.codeforcesRating,
        maxRating: user.maxRating,
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
    res.json(user);
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

module.exports = { register, login, getUser, logout };
