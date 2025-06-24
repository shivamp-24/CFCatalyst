import { useState, useEffect } from "react";
import {
  Trophy,
  TrendingUp,
  Users,
  Target,
  Play,
  BookOpen,
  Award,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  Code,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import useAuth from "@/hooks/useAuth";
import { userApi } from "@/api/apiService";
import { useToast } from "@/hooks/use-toast";

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userHandle = user?.codeforcesHandle || "User";
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentContests, setRecentContests] = useState([]);
  const [isLoadingContests, setIsLoadingContests] = useState(false);
  const [isRefreshingContests, setIsRefreshingContests] = useState(false);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        const stats = await userApi.getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [toast]);

  // Fetch recent contests
  useEffect(() => {
    const fetchRecentContests = async (refresh = false) => {
      try {
        setIsLoadingContests(true);

        // Use our new API endpoint to get recent contests
        const contests = await userApi.getRecentContests(5, refresh);
        setRecentContests(contests);
      } catch (error) {
        console.error("Failed to fetch recent contests:", error);
        // Fallback to mock data if API fails
        setRecentContests([
          {
            type: "Codeforces",
            name: "Educational Round 162",
            problems: { solved: 4, total: 6 },
            duration: 8100,
            date: new Date(2023, 10, 15),
            rating: "+45",
          },
          {
            type: "Practice",
            name: "Dynamic Programming Set",
            problems: { solved: 8, total: 10 },
            duration: 12600,
            date: new Date(2023, 10, 12),
            performance: 78,
            id: "mock123",
          },
          {
            type: "Codeforces",
            name: "Div 2 Round 912",
            problems: { solved: 3, total: 5 },
            duration: 6300,
            date: new Date(2023, 10, 10),
            rating: "-12",
          },
        ]);

        toast({
          title: "Error",
          description: "Failed to load recent contests",
          variant: "destructive",
        });
      } finally {
        setIsLoadingContests(false);
        setIsRefreshingContests(false);
      }
    };

    fetchRecentContests();
  }, [toast]);

  // Handle refresh of recent contests
  const handleRefreshContests = async () => {
    setIsRefreshingContests(true);
    try {
      const contests = await userApi.getRecentContests(5, true);
      setRecentContests(contests);
      toast({
        title: "Success",
        description: "Recent contests refreshed successfully",
      });
    } catch (error) {
      console.error("Failed to refresh recent contests:", error);
      toast({
        title: "Error",
        description: "Failed to refresh recent contests",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingContests(false);
    }
  };

  // Format duration from seconds to hours and minutes
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Handle refresh of dashboard statistics
  const handleRefreshStats = async () => {
    try {
      setIsRefreshing(true);
      const stats = await userApi.updateDashboardStats();
      setDashboardStats(stats);
      toast({
        title: "Success",
        description: "Dashboard statistics updated successfully",
      });
    } catch (error) {
      console.error("Failed to refresh dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to update dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Define stats based on dashboard statistics
  const stats = [
    {
      title: "Problems Solved",
      value: dashboardStats?.problemsSolved?.value || "0",
      trend: dashboardStats?.problemsSolved?.trend || "0",
      icon: Target,
      color: "text-blue-600",
    },
    {
      title: "Current Rating",
      value: dashboardStats?.rating?.value || user?.codeforcesRating || "0",
      trend: dashboardStats?.rating?.trend || "0",
      icon: Trophy,
      color: "text-yellow-600",
    },
    {
      title: "Practice Contests",
      value: dashboardStats?.practiceContests?.value || "0",
      trend: dashboardStats?.practiceContests?.trend || "0",
      icon: Award,
      color: "text-green-600",
    },
    {
      title: "Average Performance",
      value: `${dashboardStats?.performance?.value || "0"}%`,
      trend: `${dashboardStats?.performance?.trend || "0"}%`,
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  const recommendedProblems = [
    {
      name: "Binary Search Tree",
      rating: 1400,
      tags: ["trees", "data structures"],
    },
    { name: "Graph Traversal", rating: 1300, tags: ["graphs", "dfs"] },
    { name: "Dynamic Programming", rating: 1500, tags: ["dp", "optimization"] },
  ];

  // Helper function to determine trend color and icon
  const renderTrend = (trend) => {
    const trendValue = parseFloat(trend);
    if (trendValue > 0) {
      return (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <ArrowUp className="h-3 w-3" />+{trend} from last month
        </p>
      );
    } else if (trendValue < 0) {
      return (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <ArrowDown className="h-3 w-3" />
          {trend} from last month
        </p>
      );
    } else {
      return (
        <p className="text-xs text-gray-600 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          No change from last month
        </p>
      );
    }
  };

  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeDate = (date) => {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userHandle}!
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Stats
          </Button>
        </div>
        <p className="text-gray-600">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={isLoading ? "opacity-60 animate-pulse" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {renderTrend(stat.trend)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          <Link to="/practice" className="block h-full">
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] h-full min-h-[200px] flex flex-col">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="p-6 flex flex-col items-center text-center flex-grow">
                <div className="rounded-full bg-white/20 p-3 mb-4">
                  <Play className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Practice Contest</h3>
                <p className="text-sm text-blue-100">
                  Start a timed contest with custom problems
                </p>
              </div>
            </div>
          </Link>

          <Link to="/problems" className="block h-full">
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] h-full min-h-[200px] flex flex-col">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="p-6 flex flex-col items-center text-center flex-grow">
                <div className="rounded-full bg-white/20 p-3 mb-4">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Browse Problems</h3>
                <p className="text-sm text-purple-100">
                  Explore our curated problem library
                </p>
              </div>
            </div>
          </Link>

          <Link to="/leaderboard" className="block h-full">
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] h-full min-h-[200px] flex flex-col">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="p-6 flex flex-col items-center text-center flex-grow">
                <div className="rounded-full bg-white/20 p-3 mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
                <p className="text-sm text-green-100">
                  See how you rank among other users
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest practice sessions and contests
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isLoadingContests && !isRefreshingContests && (
                  <div className="animate-spin">
                    <RefreshCw className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshContests}
                  disabled={isRefreshingContests}
                  className="flex items-center gap-1"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isRefreshingContests ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingContests ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 border rounded-lg animate-pulse bg-gray-50"
                      >
                        <div className="flex-grow">
                          <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-6 w-12 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : recentContests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Code className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No recent contests found.</p>
                    <p className="text-sm mt-1">
                      Start a practice contest to see your activity here.
                    </p>
                  </div>
                ) : (
                  recentContests.map((contest, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        contest.type === "Codeforces"
                          ? "border-blue-100 bg-blue-50/50"
                          : "border-purple-100 bg-purple-50/50"
                      } hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              contest.type === "Codeforces"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {contest.type}
                          </span>
                          <span className="font-medium">{contest.name}</span>
                          <span className="text-xs text-gray-500">
                            {formatRelativeDate(new Date(contest.date))}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Code className="h-3.5 w-3.5" />
                            {contest.problems.solved}/{contest.problems.total}{" "}
                            problems
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(contest.duration)}
                          </div>
                        </div>
                      </div>
                      {contest.type === "Codeforces" ? (
                        <div
                          className={`font-medium ${
                            contest.rating && contest.rating.startsWith("+")
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {contest.rating}
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium text-purple-700">
                            {contest.performance}% performance
                          </div>
                          {contest.id && (
                            <Link
                              to={`/practice-contests/${contest.id}`}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              View details
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Problem Solving Rate</span>
                    <span>{dashboardStats?.performance?.value || 0}%</span>
                  </div>
                  <Progress
                    value={dashboardStats?.performance?.value || 0}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Contest Performance</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Consistency Score</span>
                    <span>82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Problems */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Problems</CardTitle>
              <CardDescription>Based on your performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendedProblems.map((problem, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="font-medium text-sm mb-1">
                      {problem.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-600 font-medium">
                        {problem.rating}
                      </span>
                      <div className="flex gap-1">
                        {problem.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
