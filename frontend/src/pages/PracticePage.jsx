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
import {
  Trophy,
  Target,
  Settings,
  Play,
  Loader2,
  Sparkles,
  Clock,
  BarChart3,
  Zap,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Users,
  Star,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { practiceContestApi } from "@/api/apiService";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/api/apiService";

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
  const [isLoadingWeakTopics, setIsLoadingWeakTopics] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // Fetch recent practice contests when component mounts
    fetchRecentContests();

    // Fetch weak topics when component mounts
    if (generationMode === "WEAK_TOPIC") {
      fetchWeakTopics();
    }
  }, []);

  useEffect(() => {
    // Fetch weak topics when generation mode changes to WEAK_TOPIC
    if (generationMode === "WEAK_TOPIC") {
      fetchWeakTopics();
    }
  }, [generationMode]);

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

  const fetchWeakTopics = async (refresh = false) => {
    setIsLoadingWeakTopics(true);
    try {
      const { weakTopics: topics, lastUpdated } = await userApi.getWeakTopics(
        refresh
      );
      console.log("Received weak topics:", topics);

      if (!topics || topics.length === 0) {
        console.log("No weak topics received, using default topics");
        setWeakTopics([
          { name: "Dynamic Programming", successRate: 45, status: "critical" },
          {
            name: "Graph Algorithms",
            successRate: 62,
            status: "needs-improvement",
          },
          { name: "Number Theory", successRate: 58, status: "poor" },
        ]);
      } else {
        setWeakTopics(topics);
      }

      setLastUpdated(lastUpdated ? new Date(lastUpdated) : null);

      if (refresh) {
        toast({
          title: "Success",
          description: "Weak topics refreshed successfully",
          variant: "success",
        });
      }
    } catch (err) {
      console.error("Error fetching weak topics:", err);
      toast({
        title: "Error",
        description: "Failed to load weak topics analysis",
        variant: "warning",
      });
      // Set some default topics as fallback
      setWeakTopics([
        { name: "Dynamic Programming", successRate: 45, status: "critical" },
        {
          name: "Graph Algorithms",
          successRate: 62,
          status: "needs-improvement",
        },
        { name: "Number Theory", successRate: 58, status: "poor" },
      ]);
    } finally {
      setIsLoadingWeakTopics(false);
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

  // Handle rating input changes with validation
  const handleMinRatingChange = (e) => {
    // Allow any value during typing
    setRatingRange([parseInt(e.target.value) || 800, ratingRange[1]]);
  };

  const handleMaxRatingChange = (e) => {
    // Allow any value during typing
    setRatingRange([ratingRange[0], parseInt(e.target.value) || 3500]);
  };

  // Handle blur (when user leaves the input field)
  const handleMinRatingBlur = (e) => {
    const numValue = parseInt(e.target.value) || 800;
    const validValue = Math.max(800, Math.min(numValue, ratingRange[1]));
    setRatingRange([validValue, ratingRange[1]]);
  };

  const handleMaxRatingBlur = (e) => {
    const numValue = parseInt(e.target.value) || 3500;
    const validValue = Math.min(3500, Math.max(numValue, ratingRange[0]));
    setRatingRange([ratingRange[0], validValue]);
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

  const getModeIcon = (mode) => {
    switch (mode) {
      case "GENERAL":
        return <Sparkles className="h-4 w-4" />;
      case "USER_TAGS":
        return <BookOpen className="h-4 w-4" />;
      case "WEAK_TOPIC":
        return <TrendingUp className="h-4 w-4" />;
      case "CONTEST_SIMULATION":
        return <Trophy className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getModeDescription = (mode) => {
    switch (mode) {
      case "GENERAL":
        return "Diverse Codeforces problems to enhance your overall skills.";
      case "USER_TAGS":
        return "Practice problems tailored to your chosen Codeforces topics.";
      case "WEAK_TOPIC":
        return "Target weak topics auto-detected from unsolved Codeforces submissions.";
      case "CONTEST_SIMULATION":
        return "Prepare for your next Codeforces contest with problems tailored to your chosen division.";
      default:
        return "";
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

  const getTopicStatusText = (status) => {
    switch (status) {
      case "critical":
        return "below average";
      case "needs-improvement":
        return "needs improvement";
      case "poor":
        return "below target";
      default:
        return "unknown status";
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
              Practice Contest Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Create personalized practice contests to improve your competitive
              programming skills
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Generation Mode */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    Contest Generation Mode
                  </CardTitle>
                  <CardDescription className="text-base">
                    Choose how you want to generate your practice contest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={generationMode}
                    onValueChange={setGenerationMode}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {[
                      {
                        value: "GENERAL",
                        label: "General",
                        icon: Sparkles,
                        color: "from-blue-500 to-cyan-500",
                      },
                      {
                        value: "USER_TAGS",
                        label: "User Tags",
                        icon: BookOpen,
                        color: "from-green-500 to-emerald-500",
                      },
                      {
                        value: "WEAK_TOPIC",
                        label: "Weak Topics",
                        icon: TrendingUp,
                        color: "from-orange-500 to-red-500",
                      },
                      {
                        value: "CONTEST_SIMULATION",
                        label: "Contest Simulation",
                        icon: Trophy,
                        color: "from-purple-500 to-pink-500",
                      },
                    ].map((mode) => {
                      const IconComponent = mode.icon;
                      return (
                        <div key={mode.value} className="relative">
                          <RadioGroupItem
                            value={mode.value}
                            id={mode.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={mode.value}
                            className={`flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md min-h-[180px] justify-between ${
                              generationMode === mode.value
                                ? `border-transparent bg-gradient-to-r ${mode.color} text-white shadow-lg`
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div
                              className={`p-3 rounded-lg ${
                                generationMode === mode.value
                                  ? "bg-white/20"
                                  : `bg-gradient-to-r ${mode.color}`
                              }`}
                            >
                              <IconComponent
                                className={`h-6 w-6 ${
                                  generationMode === mode.value
                                    ? "text-white"
                                    : "text-white"
                                }`}
                              />
                            </div>
                            <div className="text-center flex-1 flex flex-col justify-center my-3">
                              <div className="font-semibold text-lg mb-2">
                                {mode.label}
                              </div>
                              <div
                                className={`text-sm line-clamp-2 px-2 ${
                                  generationMode === mode.value
                                    ? "text-white/90"
                                    : "text-gray-500"
                                }`}
                              >
                                {getModeDescription(mode.value)}
                              </div>
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Rating Range - Common for all modes */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    Rating Range
                  </CardTitle>
                  <CardDescription className="text-base">
                    Set the difficulty range for your practice contest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-xl">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-gray-800">
                          {ratingRange[0]} - {ratingRange[1]}
                        </div>
                        <div className="text-sm text-gray-600">
                          Current Rating Range
                        </div>
                      </div>
                      <div className="relative">
                        <Slider
                          value={ratingRange}
                          onValueChange={setRatingRange}
                          max={3500}
                          min={800}
                          step={100}
                          className="mt-4"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>800</span>
                          <span>3500</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="min-rating"
                          className="text-sm font-medium"
                        >
                          Min Rating
                        </Label>
                        <Input
                          id="min-rating"
                          type="number"
                          value={ratingRange[0]}
                          onChange={handleMinRatingChange}
                          onBlur={handleMinRatingBlur}
                          className="h-12 text-center text-lg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="max-rating"
                          className="text-sm font-medium"
                        >
                          Max Rating
                        </Label>
                        <Input
                          id="max-rating"
                          type="number"
                          value={ratingRange[1]}
                          onChange={handleMaxRatingChange}
                          onBlur={handleMaxRatingBlur}
                          className="h-12 text-center text-lg font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Tags Selection - Only for USER_TAGS mode */}
              {generationMode === "USER_TAGS" && (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      Problem Tags
                    </CardTitle>
                    <CardDescription className="text-base">
                      Select the tags you want to focus on in your practice
                      contest
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {commonTags.map((tag) => (
                        <div key={tag} className="relative">
                          <Checkbox
                            id={tag}
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => handleTagToggle(tag)}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={tag}
                            className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ${
                              selectedTags.includes(tag)
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {tag}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedTags.length > 0 && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm font-medium text-green-800 mb-2">
                          Selected Tags ({selectedTags.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Weak Topics Display - Only for WEAK_TOPIC mode */}
              {generationMode === "WEAK_TOPIC" && (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        Weak Topics Analysis
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => fetchWeakTopics(true)}
                        disabled={isLoadingWeakTopics}
                      >
                        {isLoadingWeakTopics ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                      </Button>
                    </div>
                    <CardDescription className="text-base">
                      Based on your performance, we've identified these areas
                      for improvement
                      {lastUpdated && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last updated: {lastUpdated.toLocaleString()}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingWeakTopics ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                      </div>
                    ) : weakTopics.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <TrendingUp className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600">
                          No weak topics identified yet. Try solving more
                          problems!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {weakTopics.map((topic, index) => {
                          // Determine styling based on topic status
                          let bgClass =
                            "from-orange-50 to-orange-100 border-orange-200";
                          let iconBgClass = "bg-orange-500";
                          let textClass = "text-orange-800";
                          let descClass = "text-orange-600";
                          let Icon = BookOpen;

                          if (topic.status === "critical") {
                            bgClass = "from-red-50 to-red-100 border-red-200";
                            iconBgClass = "bg-red-500";
                            textClass = "text-red-800";
                            descClass = "text-red-600";
                            Icon = TrendingUp;
                          } else if (topic.status === "poor") {
                            bgClass =
                              "from-yellow-50 to-yellow-100 border-yellow-200";
                            iconBgClass = "bg-yellow-500";
                            textClass = "text-yellow-800";
                            descClass = "text-yellow-600";
                            Icon = BarChart3;
                          }

                          return (
                            <div
                              key={index}
                              className={`p-4 bg-gradient-to-r ${bgClass} border rounded-xl`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className={`p-2 ${iconBgClass} rounded-lg`}
                                >
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                                <div className={`font-semibold ${textClass}`}>
                                  {topic.name}
                                </div>
                              </div>
                              <div className={`text-sm ${descClass} ml-11`}>
                                Success rate: {topic.successRate}% (
                                {getTopicStatusText(topic.status)})
                                {topic.total && (
                                  <span className="ml-2">
                                    ({topic.accepted}/{topic.total} problems
                                    solved)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contest Type Selection - Only for CONTEST_SIMULATION mode */}
              {generationMode === "CONTEST_SIMULATION" && (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      Contest Type
                    </CardTitle>
                    <CardDescription className="text-base">
                      Select the type of contest you want to prepare for
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={contestType} onValueChange={setContestType}>
                      <SelectTrigger className="h-12 text-base bg-white border-gray-300 hover:border-purple-400 focus:border-purple-500 transition-colors">
                        <SelectValue
                          placeholder="Select contest type"
                          className="text-gray-600 placeholder:text-gray-400"
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                        {contestTypes.map((type) => (
                          <SelectItem
                            key={type.value}
                            value={type.value}
                            className="bg-white hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-700 py-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-purple-500" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-4 text-xs text-gray-500">
                      Select a contest type to simulate the difficulty
                      distribution of official Codeforces contests
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contest Configuration - Common for all modes */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    Contest Configuration
                  </CardTitle>
                  <CardDescription className="text-base">
                    Customize your practice contest settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        Number of Problems
                      </Label>
                      <div className="text-2xl font-bold text-blue-600">
                        {problemCount[0]}
                      </div>
                    </div>
                    <div className="relative">
                      <Slider
                        value={problemCount}
                        onValueChange={setProblemCount}
                        max={8}
                        min={3}
                        step={1}
                        className="mt-4"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>3</span>
                        <span>8</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label
                      htmlFor="timeLimit"
                      className="text-base font-medium mb-2 block"
                    >
                      Duration
                    </Label>
                    <Select value={timeLimit} onValueChange={setTimeLimit}>
                      <SelectTrigger className="h-12 text-base bg-white border-gray-300 hover:border-purple-400 focus:border-purple-500 transition-colors">
                        <SelectValue className="text-gray-600 placeholder:text-gray-400" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                        <SelectItem
                          value="1"
                          className="bg-white hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-700 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>1 hour</span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="2"
                          className="bg-white hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-700 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>2 hours</span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="3"
                          className="bg-white hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-700 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>3 hours</span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="4"
                          className="bg-white hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-700 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>4 hours</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2 text-xs text-gray-500">
                      Choose how long you want your practice session to be
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Contest Preview */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    Contest Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-gray-600">Mode:</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-2">
                        {getModeIcon(generationMode)}
                        {getModeName(generationMode)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-gray-600">Problems:</span>
                      <span className="font-semibold text-blue-600">
                        {problemCount[0]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {timeLimit} hours
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-gray-600">Rating Range:</span>
                      <span className="font-semibold text-gray-800">
                        {ratingRange[0]}-{ratingRange[1]}
                      </span>
                    </div>
                    {generationMode === "USER_TAGS" &&
                      selectedTags.length > 0 && (
                        <div className="p-3 bg-white rounded-lg border">
                          <span className="text-gray-600 block mb-2">
                            Tags:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {selectedTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {generationMode === "CONTEST_SIMULATION" && contestType && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-gray-600">Contest Type:</span>
                        <span className="font-semibold text-gray-800 text-xs text-right">
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
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="pt-6">
                  <Button
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                    onClick={handleGenerateContest}
                    disabled={
                      isGenerating ||
                      (generationMode === "CONTEST_SIMULATION" && !contestType)
                    }
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="mr-3 h-5 w-5" />
                        Generate Practice Contest
                      </>
                    )}
                  </Button>
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 text-center">
                        {error}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 text-center mt-4">
                    This will create a new practice contest based on your
                    settings
                  </p>
                </CardContent>
              </Card>

              {/* Recent Contests */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    Recent Practice Contests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                  ) : recentContests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">
                        No recent practice contests found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentContests.map((contest) => (
                        <div
                          key={contest._id}
                          className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-800">
                              {contest.contestTypeParams
                                ?.requestedGenerationMode
                                ? getModeName(
                                    contest.contestTypeParams
                                      .requestedGenerationMode
                                  )
                                : "Practice Contest"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {contest.problems?.length || 0} problems
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(contest.durationMinutes)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              {contest.status === "COMPLETED" && (
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                  <Award className="h-4 w-4" />
                                  Score:{" "}
                                  {contest.problems?.filter((p) => p.solved)
                                    .length || 0}
                                  /{contest.problems?.length || 0}
                                </span>
                              )}
                              {contest.status === "ONGOING" && (
                                <span className="flex items-center gap-1 text-blue-600 font-medium">
                                  <Play className="h-4 w-4" />
                                  In Progress
                                </span>
                              )}
                              {contest.status === "PENDING" && (
                                <span className="flex items-center gap-1 text-yellow-600 font-medium">
                                  <Clock className="h-4 w-4" />
                                  Not Started
                                </span>
                              )}
                            </div>
                            <Link
                              to={`/practice/${contest._id}`}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              View Contest →
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
      </div>
    </DashboardLayout>
  );
};

export default PracticePage;
