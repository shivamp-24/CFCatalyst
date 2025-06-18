const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

// Import Routes
const authRouter = require("./routes/auth.routes");
const userRouter = require("./routes/user.routes");
const problemRouter = require("./routes/problem.routes");
const contestRouter = require("./routes/contest.routes");
const practiceContestRouter = require("./routes/practiceContest.routes");
const submissionRouter = require("./routes/submission.routes");

const app = express();

// Connect to MongoDB
const connectDB = require("./config/mongodb");
connectDB();

// Middlewares
app.use(cors()); // Allows all origins by default
app.use(express.json()); // Body Parser Middleware to handle JSON request bodies

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/problems", problemRouter);
app.use("/api/contests", contestRouter);
app.use("/api/practice-contests", practiceContestRouter);
app.use("/api/sunmissions", submissionRouter);

// Basic Root Route for testing if server is up
app.get("/", (req, res) => {
  res.send("CFCatalyst API is up and running!");
});

// Port Configuration and Server Start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access API at http://localhost:${PORT}`);
  console.log(`Current User: shivamp-24`);
  console.log(`Server Start Time (UTC): ${new Date().toISOString()}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
