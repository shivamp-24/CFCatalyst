import { useState, useEffect } from "react";
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
} from "lucide-react";

const PracticeContestPage = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contest, setContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetchContest();
  }, [contestId]);

  const fetchContest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await practiceContestApi.getContest(contestId);
      setContest(data);
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

  const handleStartContest = async () => {
    setIsStarting(true);

    try {
      const updatedContest = await practiceContestApi.startContest(contestId);
      setContest(updatedContest);
      toast({
        title: "Success",
        description: "Practice contest started successfully!",
      });
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

  // Calculate time remaining for ongoing contests
  const calculateTimeRemaining = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return null;

    const endTime = new Date(
      new Date(startTime).getTime() + durationMinutes * 60000
    );
    const now = new Date();

    if (now > endTime) return "Expired";

    const diffMs = endTime - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHrs}h ${diffMins}m remaining`;
  };

  // Get problem URL for Codeforces
  const getProblemUrl = (problem) => {
    if (!problem || !problem.problemId) return "#";

    const contestId = problem.contestId;
    const index = problem.index;

    return `https://codeforces.com/contest/${contestId}/problem/${index}`;
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
              <div className="flex items-center text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {calculateTimeRemaining(
                    contest.startTime,
                    contest.durationMinutes
                  )}
                </span>
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

              {contest.status === "PENDING" && (
                <Button
                  onClick={handleStartContest}
                  disabled={isStarting}
                  className="bg-blue-600 hover:bg-blue-700"
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Problems</h2>
          <div className="space-y-4">
            {contest.problems.map((problemData, index) => {
              const problem = problemData.problem;
              const isProblemSolved = problemData.solved;
              const isEditorialAccessed = problemData.editorialAccessed;

              return (
                <Card
                  key={problem._id}
                  className={`${isProblemSolved ? "border-green-300" : ""}`}
                >
                  <CardHeader className="pb-2">
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
                      <div className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {problem.rating || "Unknown"} rating
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 pt-0">
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
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between">
                    <div className="text-sm text-gray-500">
                      {isProblemSolved ? (
                        <span className="text-green-600">Solved</span>
                      ) : (
                        <span>Not solved yet</span>
                      )}
                      {isEditorialAccessed && (
                        <span className="ml-4 text-orange-600">
                          Editorial accessed
                        </span>
                      )}
                    </div>
                    <a
                      href={getProblemUrl(problem)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      Open Problem <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
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
