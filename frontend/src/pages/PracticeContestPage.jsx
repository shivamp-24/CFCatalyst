import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { practiceContestApi } from "@/api/apiService";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Clock,
  Calendar,
  Award,
  ExternalLink,
  Play,
  Check,
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Eye,
  Tag,
} from "lucide-react";

const PracticeContestPage = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contest, setContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAccessingEditorial, setIsAccessingEditorial] = useState({});
  const [showRatings, setShowRatings] = useState({});
  const [showTags, setShowTags] = useState({});

  const timerRef = useRef(null);
  const syncIntervalRef = useRef(null);

  useEffect(() => {
    fetchContest();

    // Cleanup function to clear intervals when component unmounts
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [contestId]);

  useEffect(() => {
    // Set up timer and sync interval if contest is ongoing
    if (contest && contest.status === "ONGOING") {
      setupTimer();
      setupSyncInterval();
    } else {
      // Clear intervals if contest is not ongoing
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    }
  }, [contest]);

  const fetchContest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await practiceContestApi.getContest(contestId);
      setContest(data);

      // Initialize time remaining if contest is ongoing
      if (data.status === "ONGOING" && data.startTime && data.durationMinutes) {
        updateTimeRemaining(data.startTime, data.durationMinutes);
      }
    } catch (err) {
      console.error("Error fetching contest:", err);
      setError("Failed to load practice contest");
      toast({
        title: "Error",
        description: "Failed to load practice contest",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupTimer = () => {
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Set up a new timer that updates every second
    timerRef.current = setInterval(() => {
      if (contest && contest.startTime && contest.durationMinutes) {
        const remaining = updateTimeRemaining(
          contest.startTime,
          contest.durationMinutes
        );

        // If time is up, complete the contest
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          handleContestComplete();
        }
      }
    }, 1000);
  };

  const setupSyncInterval = () => {
    // Clear any existing sync interval
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

    // Set up sync interval to run every 2 minutes
    syncIntervalRef.current = setInterval(() => {
      if (contest && contest.status === "ONGOING") {
        syncSubmissions();
      } else {
        clearInterval(syncIntervalRef.current);
      }
    }, 120000); // 2 minutes
  };

  const updateTimeRemaining = (startTime, durationMinutes) => {
    const endTime = new Date(
      new Date(startTime).getTime() + durationMinutes * 60000
    );
    const now = new Date();
    const diffMs = endTime - now;

    if (diffMs <= 0) {
      setTimeRemaining("Time's up!");
      return 0;
    }

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

    setTimeRemaining(
      `${diffHrs.toString().padStart(2, "0")}:${diffMins
        .toString()
        .padStart(2, "0")}:${diffSecs.toString().padStart(2, "0")}`
    );
    return diffMs;
  };

  const handleStartContest = async () => {
    setIsStarting(true);

    try {
      const updatedContest = await practiceContestApi.startContest(contestId);
      setContest(updatedContest);
      toast({
        title: "Success",
        description: "Practice contest started successfully!",
      });

      // Set up timer and sync interval
      setupTimer();
      setupSyncInterval();
    } catch (err) {
      console.error("Error starting contest:", err);
      toast({
        title: "Error",
        description: "Failed to start practice contest",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleContestComplete = async () => {
    try {
      // First sync submissions to ensure we have the latest data
      await syncSubmissions();

      // Then complete the contest
      const updatedContest = await practiceContestApi.completeContest(
        contestId
      );
      setContest(updatedContest);

      toast({
        title: "Contest Completed",
        description: "Your practice contest has been completed!",
      });

      // Clear intervals
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    } catch (err) {
      console.error("Error completing contest:", err);
      toast({
        title: "Error",
        description: "Failed to complete the contest",
        variant: "destructive",
      });
    }
  };

  const syncSubmissions = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await practiceContestApi.syncSubmissions(contestId);

      // Refresh contest data to get updated problem status
      const updatedContest = await practiceContestApi.getContest(contestId);
      setContest(updatedContest);

      if (result.data && result.data.updatedProblemsCount > 0) {
        toast({
          title: "Submissions Synced",
          description: `Found ${result.data.updatedProblemsCount} new solved problems!`,
          variant: "success",
        });
      }
    } catch (err) {
      console.error("Error syncing submissions:", err);
      // Don't show error toast every time sync fails to avoid annoying the user
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAccessEditorial = async (problemId, problem) => {
    // Don't allow accessing editorial for solved problems
    if (contest.problems.find((p) => p.problem._id === problemId && p.solved)) {
      toast({
        title: "Already Solved",
        description:
          "You cannot access editorial for problems you've already solved.",
        variant: "info",
      });
      return;
    }

    setIsAccessingEditorial((prev) => ({ ...prev, [problemId]: true }));

    try {
      await practiceContestApi.accessEditorial(contestId, problemId);

      // Refresh contest data to update editorial access status
      const updatedContest = await practiceContestApi.getContest(contestId);
      setContest(updatedContest);

      toast({
        title: "Editorial Access",
        description:
          "Editorial access has been recorded. This will affect your score.",
        variant: "warning",
      });

      // Open the editorial in a new tab
      window.open(getEditorialUrl(problem), "_blank");
    } catch (err) {
      console.error("Error accessing editorial:", err);
      toast({
        title: "Error",
        description: "Failed to record editorial access",
        variant: "destructive",
      });
    } finally {
      setIsAccessingEditorial((prev) => ({ ...prev, [problemId]: false }));
    }
  };

  // Format duration to display in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  // Get problem URL for Codeforces
  const getProblemUrl = (problem) => {
    if (!problem || !problem.problemId) return "#";

    const contestId = problem.contestId;
    const index = problem.index;

    return `https://codeforces.com/contest/${contestId}/problem/${index}`;
  };

  // Get editorial URL for Codeforces
  const getEditorialUrl = (problem) => {
    if (!problem || !problem.problemId) return "#";

    const contestId = problem.contestId;

    // Most Codeforces editorials are in the format /blog/entry/[contestId]
    // For educational rounds, they often have a specific entry number
    // This is a simplified approach - in a real app, you might want to fetch the actual editorial link
    return `https://codeforces.com/blog/entry/${contestId}`;
  };

  // Get contest type name
  const getContestTypeName = (contestTypeParams) => {
    if (!contestTypeParams) return "Practice Contest";

    const mode = contestTypeParams.requestedGenerationMode;

    switch (mode) {
      case "GENERAL":
        return "General Practice";
      case "USER_TAGS":
        return "User Tags Practice";
      case "WEAK_TOPIC":
        return "Weak Topics Practice";
      case "CONTEST_SIMULATION":
        const format = contestTypeParams.targetContestFormatUsed;
        return format ? `${format} Simulation` : "Contest Simulation";
      default:
        return "Practice Contest";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">
              Loading practice contest...
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !contest) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Contest Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The practice contest you're looking for doesn't exist or couldn't
              be loaded.
            </p>
            <Button onClick={() => navigate("/practice")}>
              Back to Practice
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getContestTypeName(contest.contestTypeParams)}
          </h1>
          <div className="flex items-center text-gray-600 space-x-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatDuration(contest.durationMinutes)}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {contest.startTime ? (
                <span>Started: {formatDate(contest.startTime)}</span>
              ) : (
                <span>Not started yet</span>
              )}
            </div>
            {contest.status === "ONGOING" && (
              <div className="flex items-center text-blue-600 font-mono font-medium">
                <Clock className="h-4 w-4 mr-1" />
                <span className="tabular-nums">{timeRemaining}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contest status card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Contest Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <div className="font-medium">
                  {contest.status === "PENDING" && (
                    <span className="text-yellow-600">Not Started</span>
                  )}
                  {contest.status === "ONGOING" && (
                    <span className="text-blue-600">In Progress</span>
                  )}
                  {contest.status === "COMPLETED" && (
                    <span className="text-green-600">Completed</span>
                  )}
                  {contest.status === "ABANDONED" && (
                    <span className="text-red-600">Abandoned</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {contest.status === "ONGOING" && (
                  <Button
                    onClick={syncSubmissions}
                    variant="outline"
                    size="sm"
                    disabled={isSyncing}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-colors"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sync Submissions
                      </>
                    )}
                  </Button>
                )}

                {contest.status === "PENDING" && (
                  <Button
                    onClick={handleStartContest}
                    disabled={isStarting}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Contest
                      </>
                    )}
                  </Button>
                )}

                {contest.status === "ONGOING" && (
                  <Button
                    onClick={handleContestComplete}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md transition-all"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Complete Contest
                  </Button>
                )}
              </div>

              {contest.status === "COMPLETED" && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Final Score</div>
                  <div className="font-medium text-lg">
                    {contest.problems.filter((p) => p.solved).length}/
                    {contest.problems.length}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Problem list */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Problems</h2>
            <div className="text-sm text-gray-600 italic flex items-center">
              <span>Problems are sorted by difficulty</span>
            </div>
          </div>
          <div className="space-y-4">
            {contest.problems.map((problemData, index) => {
              const problem = problemData.problem;
              const isProblemSolved = problemData.solved;
              const isEditorialAccessed = problemData.editorialAccessed;

              return (
                <Card
                  key={problem._id}
                  className={`${
                    isProblemSolved
                      ? "bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-md"
                      : "hover:border-gray-300 hover:shadow-sm"
                  } transition-all duration-200`}
                >
                  <CardHeader
                    className={`pb-2 ${
                      isProblemSolved ? "border-b border-green-200" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center">
                        <span className="mr-2">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {problem.name}
                        {isProblemSolved && (
                          <Check className="h-5 w-5 ml-2 text-green-600" />
                        )}
                      </CardTitle>
                      {showRatings[problem._id] ? (
                        <div
                          className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                            isProblemSolved
                              ? "bg-green-200 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {problem.rating || "Unknown"} rating
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setShowRatings((prev) => ({
                              ...prev,
                              [problem._id]: true,
                            }))
                          }
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Show Rating
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 pt-0">
                    {showTags[problem._id] ? (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {problem.tags &&
                          problem.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <div className="mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setShowTags((prev) => ({
                              ...prev,
                              [problem._id]: true,
                            }))
                          }
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          Show Tags
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between items-center">
                    <div className="text-sm">
                      {isProblemSolved ? (
                        <span className="text-green-600 font-medium flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          Solved
                        </span>
                      ) : (
                        <span className="text-gray-500">Not solved yet</span>
                      )}
                      {isEditorialAccessed && (
                        <span className="ml-4 text-orange-600">
                          Editorial accessed
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {contest.status === "ONGOING" &&
                        !isProblemSolved &&
                        !isEditorialAccessed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAccessEditorial(problem._id, problem)
                            }
                            disabled={isAccessingEditorial[problem._id]}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-colors"
                          >
                            {isAccessingEditorial[problem._id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <BookOpen className="h-3 w-3 mr-1" />
                                Hint
                              </>
                            )}
                          </Button>
                        )}
                      <a
                        href={getProblemUrl(problem)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded shadow-sm hover:shadow transition-all"
                      >
                        Open Problem <ExternalLink className="h-3 w-3 ml-1.5" />
                      </a>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contest details card */}
        <Card>
          <CardHeader>
            <CardTitle>Contest Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mode:</span>
                <span className="font-medium">
                  {contest.contestTypeParams?.requestedGenerationMode ||
                    "General"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating Range:</span>
                <span className="font-medium">
                  {contest.contestTypeParams?.effectiveMinRatingUsed || "-"} -
                  {contest.contestTypeParams?.effectiveMaxRatingUsed || "-"}
                </span>
              </div>

              {contest.contestTypeParams?.userSpecifiedTags && (
                <div>
                  <span className="text-gray-500">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contest.contestTypeParams.userSpecifiedTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {contest.contestTypeParams?.targetedWeakTags && (
                <div>
                  <span className="text-gray-500">Weak Topics:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contest.contestTypeParams.targetedWeakTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {contest.contestTypeParams?.targetContestFormatUsed && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Contest Type:</span>
                  <span className="font-medium">
                    {contest.contestTypeParams.targetContestFormatUsed}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PracticeContestPage;
