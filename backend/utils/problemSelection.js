const codeforcesService = require("../services/codeforcesService");
const Problem = require("../models/Problem");
const contestAnalysisService = require("../services/contestAnalysisService");

// Selects problems for a practice contest based on specified criteria.

// Default rating parameters
const DEFAULT_RATING_RANGE_FOR_UNRATED = { min: 800, max: 1400 };
const DEFAULT_RATING_SPAN_AROUND_USER = 200; // e.g., userRating +/- 200
const MAX_WEAK_TAGS_TO_CONSIDER = 3; // Consider top N weak tags

// Constants for CONTEST_SIMULATION mode
const SIMULATION_RATING_WINDOW_INITIAL = 150; // Target slot rating +/- (WINDOW/2) -> e.g., 150 means +/- 75
const SIMULATION_RATING_WINDOW_FALLBACK = 250; // Wider window for fallback
const SIMULATION_TAGS_PER_SLOT = 1; // Use top N tag(s) from profile for the slot
const SIMULATION_MIN_PROBLEMS_FOR_PROFILE_USE = 3; // Min problems in profile's indices to be considered usable

const selectProblems = async (
  userCodeforcesHandle,
  generationMode, //Mode of problem generation (e.g., "GENERAL", "USER_TAGS").
  problemCount,
  userMinRating,
  userMaxRating,
  userSpecifiedTags, //Target contest format (e.g., "Div. 2")
  targetContestFormat // Crucial for CONTEST_SIMULATION
) => {
  try {
    console.log(
      `[problemSelection] Initiating for ${userCodeforcesHandle}, mode: ${generationMode}, count: ${problemCount}`
    );
    console.log(
      `[problemSelection] User Ratings: min=${userMinRating}, max=${userMaxRating}. Tags: ${userSpecifiedTags}`
    );

    if (!userCodeforcesHandle || !generationMode || !problemCount) {
      throw new Error(
        "[problemSelection] Missing required parameters: userCodeforcesHandle, generationMode, or problemCount."
      );
    }

    const numProblemCount = parseInt(problemCount);

    if (isNaN(numProblemCount) || numProblemCount <= 0) {
      throw new Error(
        "[problemSelection] problemCount must be a positive number."
      );
    }

    // Initialize default return variables
    let effectiveMinRating =
      userMinRating || DEFAULT_RATING_RANGE_FOR_UNRATED.min;
    let effectiveMaxRating =
      userMaxRating || DEFAULT_RATING_RANGE_FOR_UNRATED.max;
    let selectedProblems = [];
    let tagsToQuery = [];
    let profile = null;

    // 1. Fetch Solved Problem IDs
    let solvedProblemIds = new Set();
    try {
      solvedProblemIds = await codeforcesService.getUserSolvedProblemIds(
        userCodeforcesHandle
      );
      console.log(
        `[problemSelection] User ${userCodeforcesHandle} has solved ${solvedProblemIds.size} problems.`
      );
    } catch (error) {
      console.warn(
        `[problemSelection] Could not fetch solved problems for ${userCodeforcesHandle}: ${error.message}. Proceeding without this filter.`
      );
    }

    // 2. Determine Effective Rating Range
    if (
      typeof userMinRating === "number" &&
      typeof userMaxRating === "number" &&
      userMinRating <= userMaxRating
    ) {
      effectiveMinRating = userMinRating;
      effectiveMaxRating = userMaxRating;
      console.log(
        `[problemSelection] Using user-defined rating range: ${effectiveMinRating}-${effectiveMaxRating}`
      );
    } else {
      try {
        const userInfo = await codeforcesService.getUserInfo(
          userCodeforcesHandle
        );
        const currentUserRating = userInfo ? userInfo.rating : null;

        if (currentUserRating) {
          effectiveMinRating = Math.max(
            800,
            currentUserRating - DEFAULT_RATING_SPAN_AROUND_USER
          ); // Ensure min rating is at least 800
          effectiveMaxRating =
            currentUserRating + DEFAULT_RATING_SPAN_AROUND_USER;
          console.log(
            `[problemSelection] Derived rating range from user rating ${currentUserRating}: ${effectiveMinRating}-${effectiveMaxRating}`
          );
        } else {
          effectiveMinRating = DEFAULT_RATING_RANGE_FOR_UNRATED.min;
          effectiveMaxRating = DEFAULT_RATING_RANGE_FOR_UNRATED.max;
          console.log(
            `[problemSelection] User is unrated or rating not found. Using default range: ${effectiveMinRating}-${effectiveMaxRating}`
          );
        }
      } catch (error) {
        console.warn(
          `[problemSelection] Could not fetch user info for rating derivation: ${error.message}. Using default unrated range.`
        );
        effectiveMinRating = DEFAULT_RATING_RANGE_FOR_UNRATED.min;
        effectiveMaxRating = DEFAULT_RATING_RANGE_FOR_UNRATED.max;
      }

      // Ensure minRating is not less than a global minimum if necessary (e.g. 800 for Codeforces)
      effectiveMinRating = Math.max(800, effectiveMinRating);
      effectiveMaxRating = Math.min(3500, effectiveMaxRating);
      if (effectiveMinRating > effectiveMaxRating) {
        // Safety check if derived min > max
        effectiveMaxRating =
          effectiveMinRating + DEFAULT_RATING_SPAN_AROUND_USER; // Adjust max
        console.warn(
          `[problemSelection] Adjusted effectiveMaxRating as min was higher. New range: ${effectiveMinRating}-${effectiveMaxRating}`
        );
      }
    }

    // 3. Construct MongoDB Query
    const baseMongoQuery = {}; // Base query applicable to all problems (e.g. not solved)
    if (solvedProblemIds.size > 0) {
      baseMongoQuery.problemId = { $nin: Array.from(solvedProblemIds) };
    }

    // 4. Apply Mode-Specific Logic
    switch (generationMode.toUpperCase()) {
      case "GENERAL":
        // No additional tag filters for general mode.
        console.log("[problemSelection] Mode: GENERAL");
        baseMongoQuery.rating = {
          $gte: effectiveMinRating,
          $lte: effectiveMaxRating,
        };
        break;
      case "USER_TAGS":
        console.log("[problemSelection] Mode: USER_TAGS");
        baseMongoQuery.rating = {
          $gte: effectiveMinRating,
          $lte: effectiveMaxRating,
        };
        if (userSpecifiedTags && userSpecifiedTags.length > 0) {
          tagsToQuery = userSpecifiedTags.map((tag) =>
            tag.toLowerCase().trim()
          );
          console.log(
            `[problemSelection] Applying user-specified tags: ${tagsToQuery}`
          );
        } else {
          console.log(
            "[problemSelection] No user tags for USER_TAGS mode, like GENERAL."
          );
        }
        break;
      case "WEAK_TOPIC":
        console.log("[problemSelection] Mode: WEAK_TOPIC");
        baseMongoQuery.rating = {
          $gte: effectiveMinRating,
          $lte: effectiveMaxRating,
        };

        try {
          const weakTagsResult =
            await contestAnalysisService.identifyUserWeakTags(
              userCodeforcesHandle
            );

          if (weakTagsResult && weakTagsResult.length > 0) {
            tagsToQuery = weakTagsResult
              .slice(0, MAX_WEAK_TAGS_TO_CONSIDER)
              .map((item) => item.tag);
            console.log(
              `[problemSelection] Identified weak tags to target: ${tagsToQuery}`
            );
            if (tagsToQuery.length === 0) {
              console.log(
                "[problemSelection] No actionable weak tags found after processing. Behaving like GENERAL mode."
              );
            }
          } else {
            console.log(
              "[problemSelection] No weak tags identified for the user. Behaving like GENERAL mode."
            );
          }
        } catch (error) {
          console.error(
            `[problemSelection] Error identifying weak tags: ${error.message}. Behaving like GENERAL mode.`
          );
        }
        break;
      case "CONTEST_SIMULATION":
        console.log("[problemSelection] Mode: CONTEST_SIMULATION");

        if (!targetContestFormat) {
          throw new Error(
            "[problemSelection] targetContestFormat is required for CONTEST_SIMULATION mode."
          );
        }

        profile = await contestAnalysisService.getContestProfile(
          targetContestFormat
        );

        if (
          !profile ||
          !profile.averageRatingPerIndex ||
          Object.keys(profile.averageRatingPerIndex).length <
            SIMULATION_MIN_PROBLEMS_FOR_PROFILE_USE
        ) {
          console.warn(
            `[problemSelection] Contest profile for "${targetContestFormat}" is insufficient or unavailable. Falling back to GENERAL mode.`
          );
          // Fallback to GENERAL mode logic
          baseMongoQuery.rating = {
            $gte: effectiveMinRating,
            $lte: effectiveMaxRating,
          };
          // No specific tags, general selection.
        } else {
          console.log(
            `[problemSelection] Using contest profile for "${targetContestFormat}" to select ${numProblemCount} problems.`
          );
          const alreadySelectedProblemIdsInSim = []; // Track IDs selected within this simulation attempt

          // Get sorted problem indices from profile (e.g., 'A', 'B', 'C', ...)
          const sortedProfileIndices = Object.keys(
            profile.averageRatingPerIndex
          ).sort();

          for (let i = 0; i < numProblemCount; i++) {
            if (i >= sortedProfileIndices.length) {
              console.log(
                `[problemSelection] Requested more problems (${numProblemCount}) than available slots in profile (${sortedProfileIndices.length}). Stopping slot-based selection.`
              );
              break; // Stop if we run out of profiled slots
            }

            const targetProblemIndex = sortedProfileIndices[i]; // e.g., 'A', then 'B'
            const slotTargetRating =
              profile.averageRatingPerIndex[targetProblemIndex];

            let slotQuery = { ...baseMongoQuery }; // Start with base (e.g., not solved)
            if (alreadySelectedProblemIdsInSim.length > 0) {
              slotQuery.problemId = {
                ...slotQuery.problemId,
                $nin: [
                  ...(slotQuery.problemId?.$nin || []),
                  ...alreadySelectedProblemIdsInSim,
                ],
              };
            }

            // Attempt 1: Strict slot matching
            slotQuery.rating = {
              $gte: Math.max(
                800,
                slotTargetRating - SIMULATION_RATING_WINDOW_INITIAL / 2
              ),
              $lte: slotTargetRating + SIMULATION_RATING_WINDOW_INITIAL / 2,
            };
            const slotSpecificTagsRaw =
              profile.commonTagsPerIndex?.[targetProblemIndex];
            if (slotSpecificTagsRaw && slotSpecificTagsRaw.length > 0) {
              slotQuery.tags = {
                $in: slotSpecificTagsRaw
                  .slice(0, SIMULATION_TAGS_PER_SLOT)
                  .map((t) => t.tag),
              };
            }

            console.log(
              `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 1) Query: ${JSON.stringify(
                slotQuery
              )}`
            );
            let foundProblem = await Problem.aggregate([
              { $match: slotQuery },
              { $sample: { size: 1 } },
            ]);

            if (foundProblem && foundProblem.length > 0) {
              selectedProblems.push(foundProblem[0]);
              alreadySelectedProblemIdsInSim.push(foundProblem[0].problemId);
              console.log(
                `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 1) Found: ${foundProblem[0].problemId} (${foundProblem[0].rating})`
              );
              continue;
            }

            // Attempt 2: Wider rating, same tags
            console.log(
              `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 1) FAILED. Retrying with wider rating (Attempt 2).`
            );
            slotQuery.rating = {
              $gte: Math.max(
                800,
                slotTargetRating - SIMULATION_RATING_WINDOW_FALLBACK / 2
              ),
              $lte: slotTargetRating + SIMULATION_RATING_WINDOW_FALLBACK / 2,
            };
            console.log(
              `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 2) Query: ${JSON.stringify(
                slotQuery
              )}`
            );
            foundProblem = await Problem.aggregate([
              { $match: slotQuery },
              { $sample: { size: 1 } },
            ]);

            if (foundProblem && foundProblem.length > 0) {
              selectedProblems.push(foundProblem[0]);
              alreadySelectedProblemIdsInSim.push(foundProblem[0].problemId);
              console.log(
                `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 2) Found: ${foundProblem[0].problemId} (${foundProblem[0].rating})`
              );
              continue;
            }

            // Attempt 3: Wider rating, no specific tags (use profile overall common tags or no tags)
            console.log(
              `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 2) FAILED. Retrying with no slot-specific tags (Attempt 3).`
            );
            delete slotQuery.tags; // Remove slot-specific tags
            if (
              profile.overallCommonTags &&
              profile.overallCommonTags.length > 0
            ) {
              slotQuery.tags = {
                $in: profile.overallCommonTags.slice(0, 3).map((t) => t.tag),
              }; // Use a few overall common tags
            }
            console.log(
              `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 3) Query: ${JSON.stringify(
                slotQuery
              )}`
            );
            foundProblem = await Problem.aggregate([
              { $match: slotQuery },
              { $sample: { size: 1 } },
            ]);

            if (foundProblem && foundProblem.length > 0) {
              selectedProblems.push(foundProblem[0]);
              alreadySelectedProblemIdsInSim.push(foundProblem[0].problemId);
              console.log(
                `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 3) Found: ${foundProblem[0].problemId} (${foundProblem[0].rating})`
              );
              continue;
            }
            console.warn(
              `[problemSelection] Sim Slot ${targetProblemIndex} (Attempt 3) FAILED. Could not find problem for this slot.`
            );
          }

          // After attempting to fill slots, if not enough problems, fill remaining with general problems.
          const remainingProblemsToFill =
            numProblemCount - selectedProblems.length;

          if (
            remainingProblemsToFill > 0 &&
            generationMode.toUpperCase() === "CONTEST_SIMULATION"
          ) {
            // Ensure this runs only for simulation that tried slots
            console.log(
              `[problemSelection] Sim: Attempting to fill ${remainingProblemsToFill} remaining spots generally.`
            );
            let generalFillQuery = { ...baseMongoQuery };
            generalFillQuery.rating = {
              $gte: effectiveMinRating,
              $lte: effectiveMaxRating,
            }; // Use overall contest rating range
            if (alreadySelectedProblemIdsInSim.length > 0) {
              generalFillQuery.problemId = {
                ...generalFillQuery.problemId,
                $nin: [
                  ...(generalFillQuery.problemId?.$nin || []),
                  ...alreadySelectedProblemIdsInSim,
                ],
              };
            }
            if (
              profile &&
              profile.overallCommonTags &&
              profile.overallCommonTags.length > 0
            ) {
              // Prioritize overall common tags
              generalFillQuery.tags = {
                $in: profile.overallCommonTags.slice(0, 5).map((t) => t.tag),
              };
            }

            const generalFillProblems = await Problem.aggregate([
              { $match: generalFillQuery },
              { $sample: { size: remainingProblemsToFill } },
            ]);
            if (generalFillProblems && generalFillProblems.length > 0) {
              console.log(
                `[problemSelection] Sim: Filled ${generalFillProblems.length} additional spots generally.`
              );
              selectedProblems.push(...generalFillProblems);
            }
          }
        }
        break;
      default:
        throw new Error(
          `[problemSelection] Unsupported generationMode: ${generationMode}`
        );
    }

    // This part is for modes OTHER THAN CONTEST_SIMULATION that build a single query
    if (generationMode.toUpperCase() !== "CONTEST_SIMULATION") {
      if (tagsToQuery.length > 0) {
        baseMongoQuery.tags = { $in: tagsToQuery };
      }
      console.log(
        "[problemSelection] Final MongoDB Query (for non-simulation modes):",
        JSON.stringify(baseMongoQuery)
      );

      // 5. Execute Aggregation to Fetch and Sample Problems
      selectedProblems = await Problem.aggregate([
        { $match: baseMongoQuery },
        { $sample: { size: numProblemCount } },
      ]);
    }

    console.log(
      `[problemSelection] Total selected problems: ${selectedProblems.length} (requested: ${numProblemCount})`
    );

    const finalSelectedProblems = selectedProblems.slice(0, numProblemCount); // Ensure we don't return more than requested

    if (
      finalSelectedProblems.length === 0 &&
      generationMode.toUpperCase() !== "CONTEST_SIMULATION" &&
      !(
        profile &&
        Object.keys(profile.averageRatingPerIndex).length <
          SIMULATION_MIN_PROBLEMS_FOR_PROFILE_USE &&
        generationMode.toUpperCase() === "CONTEST_SIMULATION"
      )
    ) {
      let errorMessage =
        "[problemSelection] No problems found matching your criteria.";

      if (
        generationMode.toUpperCase() === "WEAK_TOPIC" &&
        tagsToQuery.length > 0
      ) {
        errorMessage += ` (Targeted weak tags: ${tagsToQuery.join(
          ", "
        )}, Rating: ${effectiveMinRating}-${effectiveMaxRating}). Please try adjusting rating or try GENERAL mode.`;
      } else if (
        generationMode.toUpperCase() === "USER_TAGS" &&
        tagsToQuery.length > 0
      ) {
        errorMessage += ` (Targeted user tags: ${tagsToQuery.join(
          ", "
        )}, Rating: ${effectiveMinRating}-${effectiveMaxRating}). Please try adjusting rating or tags.`;
      } else if (
        generationMode.toUpperCase() === "CONTEST_SIMULATION" &&
        targetContestFormat &&
        profile
      ) {
        errorMessage += ` (Simulating: ${targetContestFormat}, Overall Rating: ${effectiveMinRating}-${effectiveMaxRating}). Profile had ${
          Object.keys(profile.averageRatingPerIndex).length
        } slots. Check slot-specific criteria or try GENERAL mode.`;
      } else {
        errorMessage += ` (Rating: ${effectiveMinRating}-${effectiveMaxRating}). Please try adjusting rating.`;
      }

      throw new Error(errorMessage);
    }

    if (selectedProblems.length < numProblemCount) {
      console.warn(
        `[problemSelection] Requested ${numProblemCount} problems, but found only ${selectedProblems.length}.`
      );
    }

    // Construct the detailed return object
    const selectionResult = {
      problems: finalSelectedProblems || [],
      effectiveMinRatingUsed: effectiveMinRating, // The actual min rating used/derived
      effectiveMaxRatingUsed: effectiveMaxRating, // The actual max rating used/derived
      generationModeUsed: generationMode.toUpperCase(), // The mode that was executed
    };

    if (
      generationMode.toUpperCase() === "WEAK_TOPIC" &&
      tagsToQuery.length > 0
    ) {
      selectionResult.targetedWeakTags = tagsToQuery;
    }

    if (
      generationMode.toUpperCase() === "USER_TAGS" &&
      tagsToQuery.length > 0
    ) {
      selectionResult.userSpecifiedTagsUsed = tagsToQuery;
    }

    if (generationMode.toUpperCase() === "CONTEST_SIMULATION") {
      selectionResult.targetContestFormatUsed = targetContestFormat;
      if (profile) {
        selectionResult.profileDetails = {
          contestsAnalyzed: profile.contestsAnalyzed,
        };
      }

      selectionResult.wasFallbackToGeneralMode =
        !profile ||
        !profile.averageRatingPerIndex ||
        Object.keys(profile.averageRatingPerIndex).length <
          SIMULATION_MIN_PROBLEMS_FOR_PROFILE_USE;
    }

    return selectionResult;
  } catch (error) {
    console.error(`[problemSelection] Error: ${error.message}`, error.stack);

    // Return a structured error response with fallback values for all fields
    return {
      error: error.message || "Unknown error in problem selection",
      problems: [], // Empty array to prevent null/undefined issues
      effectiveMinRatingUsed:
        userMinRating || DEFAULT_RATING_RANGE_FOR_UNRATED.min,
      effectiveMaxRatingUsed:
        userMaxRating || DEFAULT_RATING_RANGE_FOR_UNRATED.max,
      generationModeUsed: generationMode?.toUpperCase() || "GENERAL",
    };
  }
};

module.exports = { selectProblems };
