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

### Day 2: Backend Server Setup, Authentication, and User Management APIs

- **Server Configuration**:
  - Created `server.js` to initialize an Express server:
    - Configured `dotenv` to load environment variables (e.g., `PORT`, `MONGODB_URI`).
    - Enabled CORS with `cors()` for cross-origin requests and `express.json()` for JSON body parsing.
    - Defined a root route (`GET /`) for API health checks.
    - Started the server on a configurable port (default: 5000) with detailed startup logs.
    - Added unhandled promise rejection handling for robust error management.
- **MongoDB Connection**:
  - Developed `config/mongodb.js` to connect to MongoDB Atlas using `mongoose`:
    - Used `process.env.MONGODB_URI` for secure database access.
    - Configured connection options (`useNewUrlParser`, `useUnifiedTopology`) for compatibility.
    - Implemented error handling with `try-catch`, exiting on connection failure.
- **Authentication APIs**:
  - Created `controllers/authController.js` with functions:
    - `register`: Validates `codeforcesHandle`, `email`, and `password`; checks for duplicates; fetches Codeforces data via `codeforcesService`; hashes passwords with `bcryptjs`; saves users; and returns a JWT token.
    - `login`: Authenticates users by `email` or `codeforcesHandle` and `password` using `bcrypt.compare`, returning a JWT token.
    - `getUser`: Retrieves authenticated user data (excluding password) using `req.user.id` from JWT middleware.
    - `logout`: Confirms logout (token expiration handled client-side via `localStorage` removal).
  - Developed `routes/auth.routes.js` to define endpoints:
    - `POST /api/auth/register`: User registration.
    - `POST /api/auth/login`: User login.
    - `GET /api/auth/user`: Fetch authenticated user data (protected).
    - `POST /api/auth/logout`: Logout (protected).
- **User Management APIs**:
  - Created `controllers/userController.js` with functions:
    - `getProfile`: Fetches user profile by `codeforcesHandle`, merging local data with Codeforces API data if available.
    - `updateProfile`: Updates authenticated user’s `email`, `name`, `bio`, or `country`, validating email uniqueness.
    - `getCFStats`: Retrieves and syncs Codeforces stats for the authenticated user, updating local database if ratings change.
    - `getPracticeHistory`: Fetches the user’s practice contest history, populating problem and contest details.
  - Developed `routes/user.routes.js` to define endpoints:
    - `GET /api/users/profile/:codeforcesHandle`: Public profile retrieval.
    - `PUT /api/users/profile`: Update authenticated user’s profile (protected).
    - `GET /api/users/me/cf-stats`: Fetch Codeforces stats (protected).
    - `GET /api/users/me/practice-history`: Fetch practice contest history (protected).
- **Authentication Middleware**:
  - Created `middlewares/authMiddleware.js` to protect routes:
    - Verified JWT tokens from request headers using `jsonwebtoken`.
    - Attached `req.user` with decoded user data (`id`) for protected routes.
    - Handled token errors (e.g., invalid, expired) with specific status codes and messages.
- **Codeforces API Integration**:
  - Developed `services/codeforcesService.js` to interact with the Codeforces API:
    - Configured an `axios` instance with a 5-second timeout and `CODEFORCES_API_URL` from `.env`.
    - Implemented retry logic for API calls with exponential backoff to handle rate limits (HTTP 429).
    - Created `getUserInfo` to fetch user data by handle, parsing Codeforces API responses.
- **Route Integration**:
  - Mounted routes in `server.js`:
    - `authRouter` at `/api/auth` for authentication endpoints.
    - `userRouter` at `/api/users` for user management endpoints.

### Day 3: Problem Management APIs and Admin Access Control

- **Dependency Installation**:
  - Installed `express-rate-limit` (`npm install express-rate-limit`) to implement rate limiting for Codeforces API-dependent endpoints, preventing abuse and managing request volume.
- **Problem Management APIs**:
  - Created `controllers/problemController.js` with functions:
    - `getProblems`: Retrieves problems from MongoDB with filtering (e.g., `tags`, `minRating`, `maxRating`, `contestId`) and pagination, sorting by `contestId` (descending) and `index` (ascending).
    - `getProblem`: Fetches a specific problem by `problemId` (e.g., `1800C1`) from the database.
    - `syncProblems`: Initiates problem synchronization with the Codeforces API via `codeforcesService`, restricted to admins.
  - Developed `routes/problem.routes.js` to define endpoints:
    - `GET /api/problems`: Retrieves filtered problems (protected by `authMiddleware`).
    - `GET /api/problems/:problemId`: Fetches a specific problem (protected by `authMiddleware`).
    - `POST /api/problems/sync`: Syncs problems from Codeforces API (protected by `authMiddleware`, `adminMiddleware`, `codeforcesApiLimiter`).
  - Integrated `problemRouter` in `server.js` with `app.use("/api/problems", problemRouter)`.
- **Admin Access Control**:
  - Created `middlewares/adminMiddleware.js` to restrict routes to users with `role: "admin"`:
    - Verified `req.user.id` from JWT middleware and checked the user’s `role` in MongoDB.
    - Returned appropriate error responses for unauthorized or missing users.
  - Updated `models/User.js` to add a `role` field:
    - Type: `String`, `enum: ["user", "admin"]`, `default: "user"`.
  - Modified `controllers/userController.js` to support `role` updates in `updateProfile` if provided in `req.body`, ensuring admin-only fields are controlled.
- **Codeforces API Enhancements**:
  - Updated `services/codeforcesService.js` with new functions:
    - `getProblemsetProblems`: Fetches problems and statistics from Codeforces API’s `/problemset.problems` endpoint.
    - `syncProblems`: Synchronizes problems to MongoDB using `bulkWrite` with `upsert`, mapping Codeforces data (e.g., `problemId`, `tags`, `solvedCount`) and tracking new/updated documents.
  - Refactored problem synchronization logic from `problemController.js` to `codeforcesService.js` for modularity and cleaner controller code.
- **Rate Limiting**:
  - Created `middlewares/codeforcesApiLimiter.js` using `express-rate-limit`:
    - Limited requests to 5 per 5-minute window for Codeforces API-dependent endpoints (e.g., `/api/problems/sync`).
    - Provided clear error messages and rate limit headers for client feedback.

### Day 4: Contest Management APIs and Practice Contest Endpoints

- **Contest Management APIs**:
  - Created `controllers/contestController.js` with functions:
    - `getContests`: Retrieves contests from MongoDB with filtering (e.g., `phase`, `type`) and pagination, supporting sorting by fields like `startTimeSeconds` (default: descending). Populates `problems` for related data.
    - `getContest`: Fetches a specific contest by `contestId`, validating numeric format and populating `problems`.
    - `syncContests`: Initiates contest synchronization with the Codeforces API via `codeforcesService`, restricted to admins.
  - Developed `routes/contest.routes.js` to define endpoints:
    - `GET /api/contests`: Retrieves filtered contests (protected by `authMiddleware`).
    - `GET /api/contests/:contestId`: Fetches a specific contest (protected by `authMiddleware`).
    - `POST /api/contests/sync`: Syncs contests from Codeforces API (protected by `authMiddleware`, `adminMiddleware`, `codeforcesApiLimiter`).
  - Integrated `contestRouter` in `server.js` with `app.use("/api/contests", contestRouter)`.
- **Practice Contest Endpoints**:
  - Created `routes/practiceContest.routes.js` to define endpoints for practice contest management:
    - `POST /api/practiceContests/generate`: Generates a new practice contest.
    - `GET /api/practiceContests/:practiceContestId`: Retrieves a specific practice contest.
    - `POST /api/practiceContests/:practiceContestId/start`: Starts a practice contest.
    - `POST /api/practiceContests/:practiceContestId/complete`: Completes a practice contest.
    - `PUT /api/practiceContests/:practiceContestId/problems/:problemObjectId/editorial`: Flags editorial access for a problem.
    - `GET /api/practiceContests/:practiceContestId/leaderboard`: Fetches the leaderboard for a practice contest.
    - `GET /api/practiceContests/me`: Retrieves the authenticated user’s practice contests.
  - All endpoints are protected by `authMiddleware` for authenticated access.
- **Contest Model Enhancement**:
  - Updated `models/Contest.js` to include additional fields for richer metadata:
    - `frozen`, `relativeTimeSeconds`, `preparedBy`, `websiteUrl`, `description`, `difficulty`, `kind`, `icpcRegion`, `country`, `city`, `season`.
    - Added `index: true` on `contestId` for efficient lookups and `trim: true` on string fields for data consistency.
- **Codeforces API Enhancements**:
  - Updated `services/codeforcesService.js` with new functions:
    - `getContestList`: Fetches regular and gym contests from Codeforces API’s `/contest.list` endpoint, supporting `gym` parameter.
    - `syncContests`: Synchronizes contests to MongoDB using `bulkWrite` with `upsert`, mapping Codeforces data (e.g., `contestId`, `name`, `problems`) and linking problems to contests via `updateOne`.
  - Refactored contest synchronization logic from `contestController.js` to `codeforcesService.js` for modularity and cleaner controller code.
  - Ensured undefined fields are removed during updates to prevent null values in MongoDB.

### Day 5: Practice Contest Management APIs and Supporting Enhancements

- **Practice Contest APIs**:

  - Created `controllers/practiceContestController.js` to manage practice contest functionality:
    - `generatePracticeContest`: Generates a new practice contest based on user inputs (`contestType`, `minRating`, `maxRating`, `tags`, `problemCount`, `durationMinutes`). Validates inputs, fetches problems using `problemSelection.selectProblems`, saves the contest with `PENDING` status, and updates the user’s `practiceContestHistory`. Returns populated contest data with user and problem details.
    - `getPracticeContest`: Retrieves a specific practice contest by `practiceContestId`, ensuring the requesting user is the owner. Populates user and problem details for the response.
    - `startPracticeContest`: Starts a practice contest, transitioning its status from `PENDING` to `ONGOING`, setting `startTime` and `endTime` based on `durationMinutes`. Validates user ownership and contest status.
    - `completePracticeContest`: Completes a practice contest, updating its status to `COMPLETED` and setting `endTime` to the current time if completed early. Processes `problemSolutions` to update `solved` status and `userSolveTimeSeconds`, calculates `userPerformanceRating` and `userRatingChange` using `ratingCalculation`, and generates a single-user leaderboard with score and penalty.
    - `flagEditorialAccess`: Flags editorial access for a specific problem in a practice contest, updating `editorialAccessed` to `true` for penalty tracking.
    - `getLeaderboard`: Retrieves the leaderboard for a practice contest. If no leaderboard exists, generates a default one based on solved problems and solve times. Populates user details for display.
    - `getUserPracticeContests`: Fetches all practice contests for the authenticated user with pagination and optional `status` filtering. Sorts by creation date (descending) and populates basic problem details.
  - Integrated utility functions:
    - Used `problemSelection.selectProblems` (placeholder) for problem selection logic.
    - Used `ratingCalculation.calculatePerformanceRating` and `ratingCalculation.calculateRatingChange` (placeholders) for rating computations.
  - Defined routes in `routes/practiceContest.routes.js` (previously created on Day 4) and mounted them in `server.js` with `app.use("/api/practice-contests", practiceContestRouter)`.

- **Model Enhancements**:

  - Updated `models/Problem.js` to improve query performance:
    - Added `index: true` to `contestId` and `problemId` fields to optimize population during contest synchronization and practice contest problem retrieval.

- **Codeforces API Enhancements**:

  - Modified `services/codeforcesService.js` to handle longer API operations:
    - Increased the `axios` client timeout from 5 seconds to 30 seconds to accommodate slower responses during contest synchronization (`syncContests`).

- **Utility Setup**:

  - Created a `utils/` directory to house reusable logic:
    - Planned `problemSelection.js` for problem selection based on user handle, contest type, rating range, and tags (logic pending).
    - Planned `ratingCalculation.js` for performance rating and rating change calculations (logic pending).

- **Server Configuration**:
  - Updated `server.js` to include the practice contest router:
    - Imported `practiceContestRouter` from `routes/practiceContest.routes.js`.
    - Mounted it at `/api/practice-contests` for handling practice contest-related endpoints.

### Day 6: Problem Selection Logic, Contest Analysis, and Model Enhancements

- **Problem Selection Logic**:

  - Created `utils/problemSelection.js` to implement problem selection for practice contests:
    - Defined `selectProblems` function to select problems based on `userCodeforcesHandle`, `generationMode` (`GENERAL`, `USER_TAGS`, `WEAK_TOPIC`, `CONTEST_SIMULATION`), `problemCount`, `userMinRating`, `userMaxRating`, `userSpecifiedTags`, and `targetContestFormat`.
    - Features:
      - Validates inputs and derives effective rating ranges based on user rating (from Codeforces API) or defaults (`800-1400` for unrated users).
      - Excludes solved problems using `codeforcesService.getUserSolvedProblemIds`.
      - Supports mode-specific logic:
        - `GENERAL`: Selects problems within rating range without tag filters.
        - `USER_TAGS`: Filters by user-provided tags and rating range.
        - `WEAK_TOPIC`: Targets user’s weak tags (via `contestAnalysisService.identifyUserWeakTags`) and rating range.
        - `CONTEST_SIMULATION`: Mimics contest format using `contestAnalysisService.getContestProfile`, selecting problems by index-specific ratings and tags with fallback to general mode if profile is insufficient.
      - Uses MongoDB aggregation with `$sample` for random problem selection.
      - Returns detailed `selectionResult` with selected problems, effective ratings, and mode-specific metadata (e.g., weak tags, contest profile).
    - Configured constants for rating windows, tag limits, and fallback behaviors to ensure robust problem selection.

- **Contest Analysis Service**:

  - Created `services/contestAnalysisService.js` to support advanced problem selection:
    - `identifyUserWeakTags`: Analyzes user submissions (via `codeforcesService.getUserSubmissions`) to identify tags of attempted but unsolved problems, sorted by frequency. Uses local `Problem` model for tag data.
    - `getContestProfile`: Generates a profile for a `targetContestFormat` (e.g., `Div. 2`) by analyzing up to 50 recent finished contests. Computes average rating per problem index, overall common tags, and index-specific tags. Filters contests with at least 3 problems for reliability.
    - Integrated with `codeforcesService` and `Problem`/`Contest` models for data retrieval and processing.

- **Practice Contest Controller Updates**:

  - Modified `controllers/practiceContestController.js` to enhance `generatePracticeContest`:
    - Updated input parameters to support `generationMode` (`GENERAL`, `USER_TAGS`, `WEAK_TOPIC`, `CONTEST_SIMULATION`), `userMinRating`, `userMaxRating`, `userSpecifiedTags`, `problemCount`, `durationMinutes`, and `targetContestFormat`.
    - Enhanced validation for mode-specific requirements (e.g., `targetContestFormat` for `CONTEST_SIMULATION`).
    - Integrated with `problemSelection.selectProblems` to fetch problems, storing detailed `contestTypeParams` (e.g., effective ratings, tags, simulation profile) in the `PracticeContest` model.
    - Improved error handling to propagate `problemSelection` errors and provide user-friendly messages.
    - Updated user’s `practiceContestHistory` with null checks for robustness.

- **Model Enhancements**:

  - Updated `models/Contest.js` to include a new field:
    - `formatCategory`: `String` field with values like `Div. 1`, `Div. 2`, `Div. 3`, `Div. 4`, `Educational`, `Global`, etc. Added `index: true` for efficient querying during contest analysis and simulation.

- **Codeforces API Enhancements**:
  - Modified `services/codeforcesService.js` to support contest analysis and problem selection:
    - Added `getUserSubmissions`: Fetches up to 20,000 submissions for a user from Codeforces API’s `/user.status` endpoint with retry logic.
    - Added `getUserSolvedProblemIds`: Extracts unique solved problem IDs from submissions with `OK` verdict.
    - Added `categorizeContestName`: Helper function to classify contest names into categories (e.g., `Div. 2`, `Educational Div. 2`, `ICPC`) based on naming patterns for `formatCategory`.
    - Updated `syncContests`:
      - Populates `formatCategory` using `categorizeContestName`.
      - Optimized problem linking to avoid unnecessary updates by comparing existing `problems` array before writing.
      - Added detailed logging for debugging and performance tracking.

### Day 7: Submission Management, Rating Calculation, and Codeforces API Authentication

- **Submission Management APIs**:

  - Created `controllers/submissionController.js` to handle submission retrieval:
    - `getSubmissionsByContest`: Retrieves all submissions for a specific practice contest by the authenticated user, sorted by `createdAt` (descending). Populates problem details (`problemId`, `name`, `rating`, `index`).
    - `getSubmissionsByProblem`: Fetches submissions for a specific problem within a practice contest by the authenticated user, sorted by `createdAt` (descending).
  - Created `routes/submission.routes.js` to define submission endpoints:
    - `GET /api/submissions/practice-contest/:practiceContestId`: Calls `getSubmissionsByContest`, protected by `authMiddleware`.
    - `GET /api/submissions/problem/:problemId/practice-contest/:practiceContestId`: Calls `getSubmissionsByProblem`, protected by `authMiddleware`.
  - Updated `server.js` to mount `submissionRouter` at `/api/submissions`.

- **Practice Contest Submission Sync**:

  - Added `syncPracticeContestSubmissions` to `controllers/practiceContestController.js`:
    - New endpoint `POST /api/practice-contests/:practiceContestId/sync` to sync user’s recent Codeforces submissions with an ongoing practice contest.
    - Validates contest existence, status (`ONGOING`), and user ownership.
    - Calls `codeforcesService.syncSubmissionsForPracticeContest` to process submissions and returns sync results (e.g., new submissions count, updated problems count).
  - Updated `routes/practiceContest.routes.js` to include the new route:
    - `POST /:practiceContestId/sync` with `authMiddleware` and `syncPracticeContestSubmissions`.

- **Codeforces API Authentication**:

  - Created `config/codeforces.js` to centralize Codeforces API interactions:
    - Implements `makeApiRequest` to handle authenticated requests using `apiKey` and `apiSecret` from `.env`. Generates `apiSig` with SHA-512 hashing for secure calls.
    - Structures exports to mirror Codeforces API endpoints (e.g., `codeforces.user.status`, `codeforces.problemset.problems`).
    - Supports unauthenticated calls if no key/secret provided.
  - Generated Codeforces API key and secret, updated `.env` with `CODEFORCES_API_KEY` and `CODEFORCES_API_SECRET`.
  - Modified `services/codeforcesService.js` to use `codeforces` module for API calls:
    - Added `syncSubmissionsForPracticeContest` to fetch user’s last 50 submissions via `codeforces.user.status`. Matches submissions to contest problems, creates new `Submission` documents, and updates contest problems for `OK` verdicts with solve times. Uses `submissionCfId` for deduplication.

- **Rating Calculation Logic**:

  - Created `utils/ratingCalculation.js` to implement rating calculations:
    - `calculatePerformanceRating`: Computes performance based on solved problems’ ratings with a speed bonus (up to 10% of problem rating) and full-solve bonus (10% multiplier). Returns lowest slot rating (90%) if no problems solved.
    - `calculateRatingChange`: Simulates Codeforces-style rating updates using a virtual field of 100 participants (normal distribution, mean 1200, stddev 350). Computes expected rank, actual rank based on performance, and rating delta (clamped to [-100, +100]).
  - Integrated with `practiceContestController.js` for `completePracticeContest` to update `userPerformanceRating` and `userRatingChange`.

- **Model Enhancements**:

  - Updated `models/Submission.js` to include a new field:
    - `submissionCfId`: `Number` field to store Codeforces submission ID, with `index: true`, `unique: true`, and `sparse: true` for efficient deduplication during sync.

- **Environment Configuration**:
  - Updated `.env` to include `CODEFORCES_API_KEY` and `CODEFORCES_API_SECRET` for authenticated Codeforces API access.

### Day 8: Frontend Setup and Initial UI Implementation

- **Frontend Project Initialization**:

  - Created a React-based frontend project using Vite as the build tool, configured in `package.json`:
    - Dependencies: `react`, `react-dom`, `react-router-dom`, `axios`, `lucide-react` (icons), `tailwindcss`, and UI libraries (`@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`).
    - Dev dependencies: `eslint`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, and related plugins for linting and build optimization.
    - Scripts: `dev`, `build`, `lint`, and `preview` for development and production workflows.
  - Set up `index.html` as the entry point, loading the React application via `main.jsx`.

- **Application Entry and Routing**:

  - Configured `main.jsx` as the main entry point:
    - Wraps the application in `StrictMode`, `Router` (from `react-router-dom`), and `AuthProvider` (from `AuthContext`) for state management and navigation.
    - Renders the `App` component into the `root` element.
  - Implemented `App.jsx` to define application routes using `react-router-dom`:
    - Public routes: `/` (Home), `/login` (Login), `/register` (Register).
    - Private route: `/dashboard` (Dashboard), protected by `PrivateRoute` component.
    - Routes map to corresponding page components (`HomePage`, `LoginPage`, `RegisterPage`, `DashboardPage`).

- **Authentication Context and Hook**:

  - Created `context/AuthContext.jsx` to manage authentication state across the application:
    - Defines `AuthContext` and `AuthProvider` to provide `user`, `token`, `login`, `register`, and `logout` functionalities.
    - Persists JWT token in `localStorage` and syncs user data via `/auth/user` endpoint on token presence.
    - Handles navigation on login (`/dashboard`), registration (`/login`), and logout (`/login`).
    - Uses `apiService` for API calls with token-based authorization.
  - Created `hooks/useAuth.js` as a custom hook to simplify access to `AuthContext` values in components.

- **API Service Setup**:

  - Created `api/apiService.js` to centralize backend API interactions:
    - Configures an `axios` instance with `baseURL` from `VITE_BACKEND_URL` (environment variable).
    - Adds request interceptor to attach JWT token (`Bearer`) from `localStorage` to authorized requests.
    - Handles errors via promise rejection for downstream handling.

- **Home Page UI Implementation**:

  - Created `pages/HomePage.jsx` as the landing page:
    - Features a responsive layout with header, hero section, features section, call-to-action (CTA) section, and footer.
    - Header: Includes logo (`Trophy` icon from `lucide-react`), app name (`CFCatalyst`), and navigation buttons (`Sign In`, `Sign Up`).
    - Hero: Promotes the platform with a headline, description, and buttons linking to `/register` and `/login`.
    - Features: Displays four cards highlighting platform benefits (`Smart Problem Selection`, `Contest Simulation`, `Performance Tracking`, `Competitive Environment`) using `lucide-react` icons and `Card` components from a custom UI library.
    - CTA: Encourages registration with a prominent button.
    - Footer: Includes copyright, terms, privacy, and contact links.
    - Styled with Tailwind CSS for responsive design and animations (via `tailwindcss-animate`).

- **Utility Functions**:
  - Created `utils/utils.js` to provide styling utilities:
    - Defines `cn` function, combining `clsx` and `tailwind-merge` to merge Tailwind classes dynamically for consistent styling.

### Day 9: Authentication UI, Toast Notifications, and Shadcn UI Integration

- **Authentication Pages Implementation**:

  - Created `pages/LoginPage.jsx` for user login:
    - Features a centered `Card` with logo (`Trophy` icon from `lucide-react`), app name (`CFCatalyst`), and a form for email/Codeforces handle and password.
    - Implements form validation with real-time feedback using `useState` for `formData`, `errors`, and `touched` states.
    - Supports login via email or Codeforces handle, calling `useAuth().login` with appropriate parameters.
    - Provides visual cues for input validity (`CheckCircle` for valid, `AlertCircle` for errors) and dynamic input styling (red/green borders).
    - Includes links to `/forgot-password` (placeholder) and `/register`.
    - Uses `useToast` for success/error notifications on login attempts.
  - Created `pages/RegisterPage.jsx` for user registration:
    - Similar layout to `LoginPage` with a form for Codeforces handle, email, password, and confirm password.
    - Validates inputs with regex for handle (alphanumeric/underscore) and email, and checks password length and match.
    - Features a password strength indicator (Weak/Medium/Strong) based on length, case, numbers, and special characters, with a dynamic progress bar.
    - Calls `useAuth().register` with mapped user data (`codeforcesHandle`, `email`, `password`).
    - Provides visual feedback and error handling similar to `LoginPage`, with toast notifications for success/error.
    - Links to `/login` for existing users.

- **Toast Notification System**:

  - Created `hooks/use-toast.jsx` to manage toast notifications:
    - Implements a reducer-based state management system with actions (`ADD_TOAST`, `UPDATE_TOAST`, `DISMISS_TOAST`, `REMOVE_TOAST`).
    - Limits to one toast at a time (`TOAST_LIMIT=1`) with auto-dismissal after 3 seconds (`TOAST_REMOVE_DELAY`).
    - Provides `useToast` hook to access `toasts`, `toast` (create), and `dismiss` functions.
    - Uses unique IDs and timeout management for smooth toast lifecycle (creation, display, animation, removal).
  - Created `ui/toaster.jsx` for rendering toasts:
    - Displays toasts in a fixed top-right container with slide-in/out animations.
    - Supports `default` and `destructive` variants (white for default, red for errors).
    - Includes a dismiss button with `X` icon from `lucide-react`.
    - Renders `title` and `description` with dynamic styling based on variant.
  - Updated `App.jsx` to include `<Toaster />` at the root level, enabling global toast notifications.

- **Shadcn UI Integration**:
  - Installed Shadcn UI components (`Input`, `Label`) using `shadcn@latest add input label`:
    - Added to `ui/` directory (assumed `src/components/ui/` based on imports `@/components/ui/`).
    - Used in `LoginPage` and `RegisterPage` for consistent form input styling.
  - Leveraged existing Shadcn components (`Card`, `Button`) from prior setup, ensuring cohesive UI design with Tailwind CSS.

### Day 10: Dashboard Implementation and Backend Enhancements

- **Backend Enhancements**:

  - Updated `controllers/authController.js`:
    - Added `updateCodeforcesData` endpoint (`PUT /api/auth/update-cf-data`) to sync user’s Codeforces rating, max rating, and avatar.
  - Updated `controllers/userController.js`:
    - Added endpoints for dashboard statistics (`getDashboardStats`, `updateDashboardStats`), and recent contests (`getRecentContests`).
    - Implemented `getRecentContests` to combine Codeforces and practice contests, with caching for Codeforces contest history and accurate problem counts via `formatContestsWithAccurateProblemCounts`.
  - Updated `models/User.js`:
    - Extended schema with `name`, `bio`, `country`, `role`, `solvedProblems`, `practiceContestHistory`, `cfContestHistory` (cached), and `dashboardStats` for storing problems solved, rating, practice contests, and performance metrics for current/previous months.
  - Updated `services/codeforcesService.js`:
    - Added `getUserContestHistory` to fetch and enhance user’s Codeforces contest history with contest details.
    - Improved `syncContests` with problem linking and contest categorization (e.g., `Div. 2`, `Educational`).
    - Enhanced error handling with retry logic and logging for API calls.
  - Created `services/dashboardStatsService.js`:
    - Implemented `getDashboardStats` and `updateDashboardStats` to compute and cache statistics for problems solved, rating, practice contests, and performance (solved problem percentage).
    - Uses `codeforcesService` to fetch submissions and user info, calculating monthly stats with trend analysis.

- **Frontend Enhancements**:
  - Updated `src/App.jsx`:
    - Added routes for `/practice`, `/problems`, `/contests`, `/leaderboard`, `/profile`, and `/settings`, all protected by `PrivateRoute`.
    - Integrated `useScrollToTop` hook for consistent page navigation behavior.
  - Created `src/components/DashboardLayout.jsx`:
    - Provides a layout wrapper for dashboard pages with `DashboardHeader` and a responsive main content area using Tailwind CSS.
  - Created `src/components/DashboardHeader.jsx`:
    - Implements a responsive header with logo (`Trophy` icon), navigation links (`Dashboard`, `Practice`, `Problems`, `Contests`, `Leaderboard`), and a user profile dropdown.
    - Features mobile menu toggle and dynamic user avatar (Codeforces avatar or initial-based fallback with rating-based color coding).
    - Includes dropdown links for `Profile`, `Activity`, `Schedule`, `Settings`, and `Sign Out` using `useAuth().logout`.
  - Created `src/components/ScrollToTop.jsx` and `src/hooks/useScrollToTop.js`:
    - Implements a custom hook to scroll to the top on route changes using `react-router-dom`’s `useLocation`.
  - Created `src/components/ui/progress.jsx`:
    - Added Shadcn UI `Progress` component for visualizing performance metrics (e.g., problem-solving rate).
  - Updated `src/components/ui/toaster.jsx`:
    - Fixed `handleDismiss` to include `event.preventDefault()` to prevent event bubbling issues.
  - Updated `src/api/apiService.js`:
    - Added `userApi` methods for fetching/updating profile, Codeforces stats, practice history, dashboard stats, and recent contests.
    - Supports query parameters for `getRecentContests` (e.g., `limit`, `refresh`).
  - Updated `src/lib/utils.js`:
    - Enhanced utility functions for Tailwind class merging, supporting new UI components.
  - Updated `src/main.jsx`:
    - Ensured proper initialization of React app with updated dependencies.
  - Updated `src/pages/DashboardPage.jsx`:
    - Implemented a comprehensive dashboard with:
      - Welcome section with user handle and refresh stats button.
      - Statistics cards for problems solved, rating, practice contests, and performance, with trend indicators (`ArrowUp`, `ArrowDown`).
      - Quick action cards for `Practice Contest`, `Browse Problems`, and `Leaderboard` with gradient styling.
      - Recent activity section displaying Codeforces and practice contests with problem counts, duration, and performance/rating changes.
      - Sidebar with performance insights (progress bars) and recommended problems based on user performance.
    - Uses `userApi` for fetching dashboard stats and recent contests, with toast notifications for success/error states.
    - Includes loading states, mock data fallback for contests, and relative date formatting.

### Day 11: Practice Contest Enhancements and UI Component Integration

- **Backend Enhancements**:

  - Updated `controllers/practiceContestController.js`:
    - Enhanced `generateContest` endpoint to support advanced problem selection based on `generationMode` (`GENERAL`, `USER_TAGS`, `WEAK_TOPIC`, `CONTEST_SIMULATION`), incorporating user-specified tags, weak topics, and contest format.
    - Improved `startContest` and `completeContest` endpoints to validate contest state transitions and update user’s `practiceContestHistory` in the `User` model.
    - Added `accessEditorial` endpoint to track editorial access per problem, updating `editorialAccessed` in the contest’s problem data.
    - Enhanced `syncSubmissions` endpoint to sync Codeforces submissions for a contest, updating `solved` status for problems based on verdict.
    - Improved error handling for invalid contest IDs, insufficient problems, and Codeforces API errors, with detailed error messages.
  - Updated `utils/problemSelection.js`:
    - Optimized problem selection algorithm to ensure balanced difficulty distribution within the specified rating range (`userMinRating`, `userMaxRating`).
    - Added support for `WEAK_TOPIC` mode by prioritizing problems from user’s weak topics (derived from performance analysis).
    - Enhanced `CONTEST_SIMULATION` mode to mimic Codeforces contest formats (e.g., `Div. 1`, `Div. 2`) with appropriate problem counts and rating distributions.
    - Improved tag-based filtering for `USER_TAGS` mode to handle edge cases (e.g., no problems matching criteria).

- **Frontend Enhancements**:
  - Updated `src/App.jsx`:
    - Added route for `/practice/:contestId` to support the new `PracticeContestPage.jsx`, ensuring seamless navigation to specific practice contests.
    - Maintained `PrivateRoute` protection for practice-related routes, leveraging existing authentication logic.
  - Updated `src/api/apiService.js`:
    - Enhanced `practiceContestApi` with robust error handling for contest generation, fetching, starting, completing, and syncing submissions.
    - Added query parameter support for `getUserContests` (e.g., `page`, `limit`, `status`) to fetch paginated practice contests with optional status filtering.
    - Ensured all API calls include JWT token via `axios` interceptor for authenticated requests.
  - Created `src/components/ui/checkbox.jsx`, `radio-group.jsx`, `select.jsx`, `slider.jsx`:
    - Installed via `npx shadcn@latest add` to provide reusable UI components for forms and inputs.
    - `checkbox.jsx`: Implements a customizable checkbox for tag selection in `PracticePage.jsx`.
    - `radio-group.jsx`: Supports radio button selection for contest generation modes (e.g., `GENERAL`, `USER_TAGS`).
    - `select.jsx`: Provides dropdown functionality for contest type and duration selection.
    - `slider.jsx`: Enables interactive range selection for problem count and rating range.
    - All components styled with Tailwind CSS for consistency with existing UI.
  - Created `src/pages/PracticePage.jsx`:
    - Implemented a comprehensive practice contest generator UI with:
      - Radio buttons for selecting generation mode (`GENERAL`, `USER_TAGS`, `WEAK_TOPIC`, `CONTEST_SIMULATION`).
      - Sliders and inputs for configuring rating range (`800-3500`) and problem count (`3-8`).
      - Select dropdown for contest duration (`1-3 hours`) and contest type (e.g., `Div. 1`, `Div. 2`) in `CONTEST_SIMULATION` mode.
      - Checkbox grid for tag selection in `USER_TAGS` mode, using common Codeforces tags (e.g., `dp`, `graphs`).
      - Mock weak topics display in `WEAK_TOPIC` mode with hardcoded performance data (e.g., `Dynamic Programming: 45%`).
      - Sidebar with contest preview and recent contests list (limited to 3), fetched via `practiceContestApi.getUserContests`.
      - Generate button to create a new contest, navigating to `/practice/:contestId` upon success.
    - Integrated `useToast` for success, warning, and error notifications (e.g., no tags selected, no problems found).
    - Handles loading states and errors with user-friendly messages.
  - Created `src/pages/PracticeContestPage.jsx`:
    - Implemented a detailed view for individual practice contests with:
      - Contest header showing mode (e.g., `General Practice`, `Div. 2 Simulation`), duration, and start time.
      - Status card displaying contest state (`PENDING`, `ONGOING`, `COMPLETED`, `ABANDONED`) and start/complete actions.
      - Problem list with cards showing problem name, rating, tags, solved status, and editorial access, with links to Codeforces problems.
      - Details card summarizing contest parameters (mode, rating range, tags, contest type).
      - Time remaining display for ongoing contests, calculated from `startTime` and `durationMinutes`.
    - Uses `practiceContestApi` for fetching contest data, starting contests, and handling errors with toast notifications.
    - Responsive design with Tailwind CSS, integrated with `DashboardLayout` for consistent layout.
