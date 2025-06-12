# CFCatalyst

This project aims to develop a web application that helps users prepare for Codeforces contests. The application will generate personalized practice contests based on upcoming contest types,user ratings, and custom rating intervals. It will also track user performance, provide a leaderboard, and offer additional features to enhance the learning experience.

## Tech Stack

- **Backend**:
  - Node.js
  - Express.js (web server)
  - Mongoose (MongoDB ORM)
  - bcryptjs (password hashing)
  - jsonwebtoken (JWT authentication)
  - axios (HTTP requests)
  - cors (cross-origin requests)
  - dotenv (environment variables)
- **Database**: MongoDB (Atlas)
- **Planned Frontend**:
  - React
  - React Router
- **Tools**:
  - npm (package management)
  - Git (version control)

## Progress

### Day 1: Backend Initialization and Schema Definition

- **Project Setup**:
  - Initialized a Node.js backend with `npm init -y`, creating `package.json`.
  - Created a `backend/` directory to house the server and related files.
  - Set up a Git repository for version control.
- **Dependency Installation**:
  - Installed `express` (`npm install express`) for building RESTful APIs.
  - Installed `mongoose` (`npm install mongoose`) for MongoDB schema management.
  - Installed `bcryptjs` (`npm install bcryptjs`) for secure password hashing.
  - Installed `jsonwebtoken` (`npm install jsonwebtoken`) for JWT-based authentication.
  - Installed `axios` (`npm install axios`) for external API requests (e.g., Codeforces API).
  - Installed `cors` (`npm install cors`) to enable cross-origin requests.
  - Installed `dotenv` (`npm install dotenv`) to manage environment variables.
- **MongoDB Configuration**:
  - Set up a MongoDB Atlas project and cluster for cloud-based data storage.
  - Saved the `MONGODB_URI` in a `.env` file for secure database connectivity.
- **Model Definitions**:
  - Created a `models/` directory to store Mongoose schemas.
  - Defined `User.js` schema:
    - Fields: `codeforcesHandle`, `email`, `password`, `codeforcesRating`, `maxRating`, `solvedProblems`, `practiceContestHistory`.
    - Features: Unique constraints, `timestamps`, and references to `PracticeContest`.
  - Defined `Problem.js` schema:
    - Fields: `problemId`, `contestId`, `name`, `index`, `rating`, `tags`, `type`, `points`, `solvedCount`.
    - Features: Unique `problemId`, `timestamps` for creation tracking.
  - Defined `Contest.js` schema:
    - Fields: `contestId`, `name`, `type`, `phase`, `startTimeSeconds`, `durationSeconds`, `problems`.
    - Features: Unique `contestId`, references to `Problem`, `timestamps`.
  - Defined `PracticeContest.js` schema:
    - Fields: `user`, `problems`, `durationMinutes`, `status`, `startTime`, `endTime`, `userPerformanceRating`, `userRatingChange`, `leaderboard`, `contestTypeParams`.
    - Features: References to `User` and `Problem`, `timestamps`, complex leaderboard structure.
  - Defined `Submission.js` schema:
    - Fields: `practiceContest`, `user`, `problem`, `code`, `language`, `verdict`, `solveTimeSeconds`, `editorialAccessBeforeSubmit`.
    - Features: References to `PracticeContest`, `User`, `Problem`, indexed fields for querying, `timestamps`.
