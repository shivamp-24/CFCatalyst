import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy, Target, Settings, Play, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { practiceContestApi } from "@/api/apiService";
import { useToast } from "@/hooks/use-toast";

const PracticePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generationMode, setGenerationMode] = useState("GENERAL");
  const [problemCount, setProblemCount] = useState([5]);
  const [timeLimit, setTimeLimit] = useState("2");
  const [ratingRange, setRatingRange] = useState([800, 3500]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [contestType, setContestType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [recentContests, setRecentContests] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);

  useEffect(() => {
    // Fetch recent practice contests when component mounts
    fetchRecentContests();
  }, []);

  const fetchRecentContests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await practiceContestApi.getUserContests(1, 3);
      setRecentContests(data.contests || []);
    } catch (err) {
      console.error("Error fetching recent contests:", err);
      setError("Failed to load recent contests");
      toast({
        title: "Error",
        description: "Failed to load recent contests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContest = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Convert timeLimit to minutes for the API
      const durationMinutes = parseFloat(timeLimit) * 60;

      const contestParams = {
        generationMode,
        userMinRating: ratingRange[0],
        userMaxRating: ratingRange[1],
        problemCount: problemCount[0],
        durationMinutes,
      };

      // Add mode-specific parameters
      if (generationMode === "USER_TAGS" && selectedTags.length > 0) {
        contestParams.userSpecifiedTags = selectedTags;
      } else if (generationMode === "USER_TAGS" && selectedTags.length === 0) {
        toast({
          title: "Warning",
          description:
            "You haven't selected any tags. The contest will be generated with general problems.",
          variant: "warning",
        });
      }

      if (generationMode === "CONTEST_SIMULATION" && contestType) {
        contestParams.targetContestFormat = contestType;
      }

      console.log("Sending contest params:", JSON.stringify(contestParams));
      const response = await practiceContestApi.generateContest(contestParams);
      console.log("Contest generation response:", response);

      toast({
        title: "Success",
        description: "Practice contest generated successfully!",
      });

      // Navigate to the contest view page with the new contest ID
      if (response && response.data && response.data._id) {
        navigate(`/practice/${response.data._id}`);
      } else {
        // Handle case where we get a successful response but no contest data
        console.error("Missing contest data in response", response);
        toast({
          title: "Warning",
          description:
            "Contest was created but couldn't navigate to it automatically. Check your practice contest list.",
          variant: "warning",
        });
      }
    } catch (err) {
      console.error("Error generating contest:", err);
      let errorMessage = "Failed to generate practice contest";

      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;

        // Provide more user-friendly messages for common errors
        if (errorMessage.includes("No problems found matching your criteria")) {
          if (generationMode === "USER_TAGS") {
            errorMessage = `No problems found with the selected tags and rating range (${ratingRange[0]}-${ratingRange[1]}). Try selecting different tags or adjusting the rating range.`;
          } else if (generationMode === "WEAK_TOPIC") {
            errorMessage = `No problems found for your weak topics in the rating range (${ratingRange[0]}-${ratingRange[1]}). Try adjusting the rating range.`;
          } else if (generationMode === "CONTEST_SIMULATION") {
            errorMessage = `No problems found for the selected contest type in the rating range (${ratingRange[0]}-${ratingRange[1]}). Try adjusting the rating range.`;
          } else {
            errorMessage = `No problems found in the rating range (${ratingRange[0]}-${ratingRange[1]}). Try adjusting the rating range.`;
          }
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const contestTypes = [
    { value: "Div. 1", label: "Codeforces Round Div.1" },
    { value: "Div. 2", label: "Codeforces Round Div.2" },
    { value: "Div. 3", label: "Codeforces Round Div.3" },
    { value: "Div. 4", label: "Codeforces Round Div.4" },
    { value: "Div. 1 + Div. 2", label: "Codeforces Round Div.1 + Div.2" },
    { value: "Educational Div. 2", label: "Educational Codeforces Round" },
    { value: "Global Round", label: "Codeforces Global Round" },
    { value: "Good Bye", label: "Good Bye" },
    { value: "Hello", label: "Hello" },
    { value: "Kotlin Heroes", label: "Kotlin Heroes" },
    { value: "ICPC", label: "ICPC" },
  ];

  const commonTags = [
    "implementation",
    "math",
    "greedy",
    "dp",
    "data structures",
    "brute force",
    "constructive algorithms",
    "graphs",
    "strings",
    "binary search",
    "number theory",
    "combinatorics",
    "geometry",
    "bitmasks",
    "two pointers",
  ];

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getModeName = (mode) => {
    switch (mode) {
      case "GENERAL":
        return "General";
      case "USER_TAGS":
        return "User Tags";
      case "WEAK_TOPIC":
        return "Weak Topics";
      case "CONTEST_SIMULATION":
        return "Contest Simulation";
      default:
        return mode;
    }
  };

  // Format contest duration to display in hours and minutes
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
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Practice Contest Generator
          </h1>
          <p className="text-gray-600">
            Create personalized practice contests to improve your competitive
            programming skills
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generation Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Contest Generation Mode
                </CardTitle>
                <CardDescription>
                  Choose how you want to generate your practice contest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={generationMode}
                  onValueChange={setGenerationMode}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="GENERAL" id="general" />
                    <Label htmlFor="general">General</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="USER_TAGS" id="user-tags" />
                    <Label htmlFor="user-tags">User Tags</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="WEAK_TOPIC" id="weak-topic" />
                    <Label htmlFor="weak-topic">Weak Topics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="CONTEST_SIMULATION"
                      id="contest-simulation"
                    />
                    <Label htmlFor="contest-simulation">
                      Contest Simulation
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Rating Range - Common for all modes */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Range</CardTitle>
                <CardDescription>
                  Set the difficulty range for your practice contest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>
                      Rating Range: {ratingRange[0]} - {ratingRange[1]}
                    </Label>
                    <Slider
                      value={ratingRange}
                      onValueChange={setRatingRange}
                      max={3500}
                      min={800}
                      step={100}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-rating">Min Rating</Label>
                      <Input
                        id="min-rating"
                        type="number"
                        value={ratingRange[0]}
                        onChange={(e) =>
                          setRatingRange([
                            parseInt(e.target.value),
                            ratingRange[1],
                          ])
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-rating">Max Rating</Label>
                      <Input
                        id="max-rating"
                        type="number"
                        value={ratingRange[1]}
                        onChange={(e) =>
                          setRatingRange([
                            ratingRange[0],
                            parseInt(e.target.value),
                          ])
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Tags Selection - Only for USER_TAGS mode */}
            {generationMode === "USER_TAGS" && (
              <Card>
                <CardHeader>
                  <CardTitle>Problem Tags</CardTitle>
                  <CardDescription>
                    Select the tags you want to focus on in your practice
                    contest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {commonTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <Label htmlFor={tag} className="text-sm">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weak Topics Display - Only for WEAK_TOPIC mode */}
            {generationMode === "WEAK_TOPIC" && (
              <Card>
                <CardHeader>
                  <CardTitle>Weak Topics Analysis</CardTitle>
                  <CardDescription>
                    Based on your performance, we've identified these areas for
                    improvement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-medium text-red-800">
                          Dynamic Programming
                        </div>
                        <div className="text-sm text-red-600">
                          Success rate: 45% (below average)
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-800">
                          Graph Algorithms
                        </div>
                        <div className="text-sm text-yellow-600">
                          Success rate: 62% (needs improvement)
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-medium text-orange-800">
                          Number Theory
                        </div>
                        <div className="text-sm text-orange-600">
                          Success rate: 58% (below target)
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contest Type Selection - Only for CONTEST_SIMULATION mode */}
            {generationMode === "CONTEST_SIMULATION" && (
              <Card>
                <CardHeader>
                  <CardTitle>Contest Type</CardTitle>
                  <CardDescription>
                    Select the type of contest you want to prepare for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={contestType} onValueChange={setContestType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contest type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contestTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Contest Configuration - Common for all modes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Contest Configuration
                </CardTitle>
                <CardDescription>
                  Customize your practice contest settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Number of Problems: {problemCount[0]}</Label>
                  <Slider
                    value={problemCount}
                    onValueChange={setProblemCount}
                    max={8}
                    min={3}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="time-limit">Duration</Label>
                  <Select value={timeLimit} onValueChange={setTimeLimit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="1.5">1.5 hours</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="2.5">2.5 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contest Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Contest Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className="font-medium">
                      {getModeName(generationMode)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Problems:</span>
                    <span className="font-medium">{problemCount[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{timeLimit} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rating Range:</span>
                    <span className="font-medium">
                      {ratingRange[0]}-{ratingRange[1]}
                    </span>
                  </div>
                  {generationMode === "USER_TAGS" &&
                    selectedTags.length > 0 && (
                      <div>
                        <span>Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTags.map((tag) => (
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
                  {generationMode === "CONTEST_SIMULATION" && contestType && (
                    <div className="flex justify-between">
                      <span>Contest Type:</span>
                      <span className="font-medium text-xs">
                        {
                          contestTypes.find((t) => t.value === contestType)
                            ?.label
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerateContest}
                  disabled={
                    isGenerating ||
                    (generationMode === "CONTEST_SIMULATION" && !contestType)
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Generate Practice Contest
                    </>
                  )}
                </Button>
                {error && (
                  <p className="text-sm text-red-500 text-center mt-2">
                    {error}
                  </p>
                )}
                <p className="text-sm text-gray-500 text-center mt-2">
                  This will create a new practice contest based on your settings
                </p>
              </CardContent>
            </Card>

            {/* Recent Contests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Practice Contests</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                ) : recentContests.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    No recent practice contests found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentContests.map((contest) => (
                      <div key={contest._id} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">
                          {contest.contestTypeParams?.requestedGenerationMode
                            ? getModeName(
                                contest.contestTypeParams
                                  .requestedGenerationMode
                              )
                            : "Practice Contest"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contest.problems?.length || 0} problems •{" "}
                          {formatDuration(contest.durationMinutes)}
                        </div>
                        <div className="text-xs mt-1">
                          {contest.status === "COMPLETED" && (
                            <span className="text-green-600">
                              Score:{" "}
                              {contest.problems?.filter((p) => p.solved)
                                .length || 0}
                              /{contest.problems?.length || 0}
                            </span>
                          )}
                          {contest.status === "ONGOING" && (
                            <span className="text-blue-600">In Progress</span>
                          )}
                          {contest.status === "PENDING" && (
                            <span className="text-yellow-600">Not Started</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <Link
                            to={`/practice/${contest._id}`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Contest
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PracticePage;
