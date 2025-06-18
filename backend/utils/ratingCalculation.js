// Calculate performance rating based on contest results.
// For practice, use average rating of solved problems (with speed bonus), or lowest slot rating if none solved.

function calculatePerformanceRating(contest) {
  if (!contest || !contest.problems || contest.problems.length === 0) return 0;

  let totalRating = 0,
    problemsSolved = 0;

  contest.problems.forEach((p) => {
    const problem =
      typeof p.problem === "object" && p.problem !== null ? p.problem : null;

    if (p.solved && problem && typeof problem.rating === "number") {
      problemsSolved++;

      //Speed bonus
      let speedBonus = 0;
      if (
        typeof p.userSolveTimeSeconds === "number" &&
        contest.durationMinutes
      ) {
        const fullTime = contest.durationMinutes * 60;
        const timeRatio = Math.max(
          0,
          Math.min(1, p.userSolveTimeSeconds / fullTime)
        );
        speedBonus = problem.rating * (0.1 * (1 - timeRatio));
      }
      totalRating += problem.rating + speedBonus;
    }
  });

  if (problemsSolved == 0) {
    // If nothing solved, base performance on lowest slot
    const minRating = contest.problems
      .map((p) => (p.problem && pr.problem.rating ? p.problem.rating : 800))
      .reduce((a, b) => Math.min(a, b), 800);

    return Math.max(800, Math.round(minRating * 0.9));
  }

  let perf = totalRating / problemsSolved;
  if (problemsSolved === contest.problems.length) {
    perf *= 1.1; // Full solve bonus
  }
  return Math.round(Math.max(800, perf));
}

const DEFAULT_USER_RATING = 1200;
const DEFAULT_FIELD_SIZE = 100; // Number of virtual participants in the field
const DEFAULT_FIELD_MEAN = 1200; // Mean rating of the virtual field
const DEFAULT_FIELD_STDDEV = 350; // Standard deviation of ratings

// Generate a virtual field of ratings (normal distribution, truncated at 800).
function generateVirtualField(
  size = DEFAULT_FIELD_SIZE,
  mean = DEFAULT_FIELD_MEAN,
  stddev = DEFAULT_FIELD_STDDEV
) {
  const ratings = [];
  while (ratings.length < size) {
    // Box-Muller transform for normal distribution
    let u = 1 - Math.random();
    let v = 1 - Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    let rating = Math.round(mean + stddev * z);
    ratings.push(Math.max(800, rating));
  }
  return ratings;
}

// Calculate expected rank (seed) for a given rating among a field.
function calculateExpectedRank(userRating, fieldRatings) {
  // The expected rank is 1 + number of people expected to outperform user
  // For each participant, probability they outperform user: 1 / (1 + 10^((userRating - r) / 400))
  let seed = 1;
  for (const r of fieldRatings) {
    seed += 1 / (1 + Math.pow(10, (userRating - r) / 400));
  }
  return seed;
}

// Given a user rank, estimate the performance rating that would yield that expected rank in the field.
// Uses binary search.
function findPerformanceRating(fieldRatings, actualRank) {
  let low = 800,
    high = 3500,
    mid;
  while (low <= high) {
    mid = (low + high) / 2;
    let seed = calculateExpectedRank(mid, fieldRatings);
    if (seed < actualRank) {
      //our rank is more than seed -> hence decrease the rating
      high = mid;
    } else {
      //our rank is less than seed -> hence increase the rating
      low = mid;
    }
  }
  return Math.round(left);
}

// Main rating update: Codeforces-style for virtual field
function calculateRatingChange(
  performanceRating,
  contestTypeParams = {},
  userCurrentRating = null
) {
  let oldRating =
    userCurrentRating ||
    contestTypeParams.userCurrentRating ||
    contestTypeParams.effectiveMinRatingUsed ||
    DEFAULT_USER_RATING;

  // 2. Generate virtual field
  const field = generateVirtualField();

  // 3. Compute expected rank (seed) for user's old rating
  const expectedRank = calculateExpectedRank(oldRating, field);

  // 4. Compute actual rank for performance rating
  // In single-user practice, treat as if user placed at percentile = % of field they outperformed
  // E.g., if solved all, actual rank = 1; if solved none, actual rank = field.length
  let actualRank;
  if (performanceRating <= oldRating) {
    actualRank = field.length;
  } else if (performanceRating >= Math.max(...field)) {
    actualRank = 1;
  } else {
    let outperformed = field.filter((r) => performanceRating > r).length;
    actualRank = field.length - outperformed;
    actualRank = Math.max(1, actualRank);
  }

  // 5. Estimate performanceRating as Codeforces does (inverse of expected rank)
  const perfRating = findPerformanceRating(field, actualRank);

  // 6. Calculate delta (rating change)
  let delta = (perfRating - oldRating) / 2; // Codeforces uses halving
  delta = Math.round(delta);

  // Clamp delta to typical Codeforces bounds [-100, +100]
  delta = Math.max(-100, Math.min(100, delta));

  return delta;
}

module.exports = { calculatePerformanceRating, calculateRatingChange };
