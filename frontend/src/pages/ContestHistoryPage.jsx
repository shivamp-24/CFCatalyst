import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Trophy,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  Share,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Code,
  ExternalLink,
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Award,
  Filter,
  FileText,
  Link2,
  Twitter,
  Linkedin,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { userApi } from "@/api/apiService";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ContestHistoryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState("all-time");
  const [sortBy, setSortBy] = useState("date-desc");
  const [contestType, setContestType] = useState("all");
  const [expandedContest, setExpandedContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contestHistory, setContestHistory] = useState([]);
  const [stats, setStats] = useState({
    totalContests: 0,
    averageProblemsPerContest: 0,
    currentRating: 0,
    lastPerformance: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
    totalContests: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Check if this is the first load of the page in this session
  const isFirstLoad = () => {
    const hasLoaded = sessionStorage.getItem("contestHistoryLoaded");
    if (!hasLoaded) {
      sessionStorage.setItem("contestHistoryLoaded", "true");
      return true;
    }
    return false;
  };

  // Fetch contest history
  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    // On first load, force a refresh. Otherwise, use cached data
    const shouldRefresh = isFirstLoad();
    fetchContestHistory(shouldRefresh, 1);
  }, [timeFilter, sortBy, contestType]);

  // When page changes, fetch the new page
  useEffect(() => {
    // Don't force refresh on page changes, use cached data
    fetchContestHistory(false, currentPage);
  }, [currentPage]);

  const fetchContestHistory = async (refresh = false, page = currentPage) => {
    try {
      setIsLoading(true);
      const response = await userApi.getAllContests({
        timeFilter,
        sortBy,
        contestType,
        refresh,
        page,
      });

      setContestHistory(response.contests);
      setStats(response.stats);
      setPagination(response.pagination);

      if (refresh) {
        toast({
          title: "Success",
          description: "Contest history refreshed with latest data",
        });
      }
    } catch (error) {
      console.error("Failed to fetch contest history:", error);
      toast({
        title: "Error",
        description: "Failed to load contest history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchContestHistory(true, currentPage);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "AC":
        return "bg-green-100 text-green-800";
      case "WA":
        return "bg-red-100 text-red-800";
      case "TLE":
        return "bg-yellow-100 text-yellow-800";
      case "Unsolved":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (rating) => {
    if (rating >= 2100) return "text-red-600";
    if (rating >= 1900) return "text-orange-600";
    if (rating >= 1600) return "text-purple-600";
    if (rating >= 1400) return "text-blue-600";
    if (rating >= 1200) return "text-green-600";
    if (rating >= 1000) return "text-cyan-600";
    return "text-gray-600";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Function to get problem URL for Codeforces problems
  const getProblemUrl = (problem, contestId) => {
    if (!problem || !contestId) return "#";
    return `https://codeforces.com/contest/${contestId}/problem/${problem.id}`;
  };

  // Function to get practice contest URL
  const getPracticeContestUrl = (contestId) => {
    if (!contestId) return "#";
    return `/practice/${contestId}`;
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pageNumbers = [];

    // Always show first page
    pageNumbers.push(1);

    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push("...");
    }

    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push("...");
    }

    // Add last page if there is more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Function to handle data export
  const handleExport = async (format) => {
    try {
      toast({
        title: "Preparing Export",
        description: "Gathering your contest history data...",
      });

      // Get total pages from current pagination
      const totalPages = pagination.totalPages;
      let allContests = [];

      // Fetch all pages based on current filters
      for (let page = 1; page <= totalPages; page++) {
        const response = await userApi.getAllContests({
          timeFilter,
          sortBy,
          contestType,
          refresh: false,
          page,
        });
        allContests = [...allContests, ...response.contests];
      }

      let fileName;
      let fileContent;

      if (format === "csv") {
        // Convert data to CSV format
        const headers = [
          "Contest Name",
          "Date",
          "Type",
          "Problems Solved",
          "Total Problems",
          "Rating Change",
          "Performance",
          "Rank",
          "Duration",
        ];
        const rows = allContests.map((contest) => [
          contest.name,
          formatDate(contest.date),
          contest.type,
          contest.problems.solved,
          contest.problems.total,
          contest.rating || "",
          contest.performanceRating || "",
          contest.rank || "",
          contest.durationFormatted || "",
        ]);

        fileContent = [headers, ...rows]
          .map((row) =>
            row
              .map((cell) =>
                typeof cell === "string" && cell.includes(",")
                  ? `"${cell}"`
                  : cell
              )
              .join(",")
          )
          .join("\n");
        fileName = `contest-history-${timeFilter}-${contestType}-${
          new Date().toISOString().split("T")[0]
        }.csv`;
      } else {
        // JSON format
        const exportData = {
          exportDate: new Date().toISOString(),
          filters: {
            timeFilter,
            sortBy,
            contestType,
          },
          stats,
          contests: allContests,
        };
        fileContent = JSON.stringify(exportData, null, 2);
        fileName = `contest-history-${timeFilter}-${contestType}-${
          new Date().toISOString().split("T")[0]
        }.json`;
      }

      // Create and trigger download
      const blob = new Blob([fileContent], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Your contest history has been exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your contest history",
        variant: "destructive",
      });
    }
  };

  // Function to handle sharing
  const handleShare = async (method) => {
    try {
      const shareData = {
        title: "My Competitive Programming Progress",
        text: `Check out my progress on CFCatalyst! Current Rating: ${stats.currentRating}, Total Contests: ${stats.totalContests}`,
        url: window.location.href,
      };

      switch (method) {
        case "clipboard":
          await navigator.clipboard.writeText(shareData.url);
          toast({
            title: "Link Copied!",
            description: "Share link has been copied to clipboard",
          });
          break;

        case "twitter":
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareData.text
          )}&url=${encodeURIComponent(shareData.url)}`;
          window.open(twitterUrl, "_blank");
          break;

        case "linkedin":
          const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            shareData.url
          )}`;
          window.open(linkedinUrl, "_blank");
          break;

        default:
          if (navigator.share) {
            await navigator.share(shareData);
            toast({
              title: "Shared Successfully",
              description: "Your progress has been shared",
            });
          }
      }
    } catch (error) {
      console.error("Sharing failed:", error);
      toast({
        title: "Sharing Failed",
        description: "There was an error sharing your progress",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <History className="h-7 w-7 text-blue-500" />
              Contest History
            </h1>
            <p className="text-gray-600 mt-1">
              Track your competitive programming journey and progress
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            title="Refresh data from Codeforces API"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Total Contests
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalContests}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Trophy className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Avg Problems/Contest
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {Number(stats.averageProblemsPerContest).toFixed(1)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <Code className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Current Rating
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.currentRating}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Last Performance
                  </p>
                  <p
                    className={`text-2xl font-bold ${getPerformanceColor(
                      stats.lastPerformance
                    )}`}
                  >
                    {stats.lastPerformance}
                  </p>
                </div>
                <div
                  className={`p-3 ${
                    stats.lastPerformance >= 1600
                      ? "bg-orange-50"
                      : "bg-blue-50"
                  } rounded-full`}
                >
                  <Award
                    className={`h-6 w-6 ${
                      stats.lastPerformance >= 1600
                        ? "text-orange-500"
                        : "text-blue-500"
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-8 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-500" />
              Filters & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Time Period</Label>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-48 bg-white border-gray-200 hover:border-blue-400 hover:ring-1 hover:ring-blue-200 transition-all">
                      <SelectValue placeholder="Time Period" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem
                        value="all-time"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        All Time
                      </SelectItem>
                      <SelectItem
                        value="last-month"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Last Month
                      </SelectItem>
                      <SelectItem
                        value="last-3-months"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Last 3 Months
                      </SelectItem>
                      <SelectItem
                        value="last-year"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Last Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 bg-white border-gray-200 hover:border-blue-400 hover:ring-1 hover:ring-blue-200 transition-all">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem
                        value="date-desc"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Newest First
                      </SelectItem>
                      <SelectItem
                        value="date-asc"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Oldest First
                      </SelectItem>
                      <SelectItem
                        value="performance-desc"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Best Performance
                      </SelectItem>
                      <SelectItem
                        value="performance-asc"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Worst Performance
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Contest Type</Label>
                  <Select value={contestType} onValueChange={setContestType}>
                    <SelectTrigger className="w-48 bg-white border-gray-200 hover:border-blue-400 hover:ring-1 hover:ring-blue-200 transition-all">
                      <SelectValue placeholder="Contest Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem
                        value="all"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        All Contests
                      </SelectItem>
                      <SelectItem
                        value="codeforces"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Codeforces Only
                      </SelectItem>
                      <SelectItem
                        value="practice"
                        className="hover:bg-blue-50 cursor-pointer focus:bg-blue-50"
                      >
                        Practice Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white border border-gray-200 shadow-lg rounded-md"
                  >
                    <DropdownMenuItem
                      onClick={() => handleExport("csv")}
                      className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-600"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExport("json")}
                      className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-600"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white border border-gray-200 shadow-lg rounded-md"
                  >
                    <DropdownMenuItem
                      onClick={() => handleShare("clipboard")}
                      className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-600"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem
                      onClick={() => handleShare("twitter")}
                      className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-600"
                    >
                      <Twitter className="h-4 w-4 mr-2" />
                      Share on Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleShare("linkedin")}
                      className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-600"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      Share on LinkedIn
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contest History List */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Contest History
              <Badge variant="outline" className="ml-2 font-normal">
                {pagination.totalContests} contests
              </Badge>
              {pagination.totalPages > 1 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-500">Loading contest history...</p>
                </div>
              </div>
            ) : contestHistory.length === 0 ? (
              <div className="text-center py-12">
                <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-600 mb-2">
                  No contests found
                </p>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Participate in Codeforces contests or create practice contests
                  to see your history
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() =>
                      window.open("https://codeforces.com/contests", "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Codeforces Contests
                  </Button>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => navigate("/practice")}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Start Practice Contest
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {contestHistory.map((contest) => (
                  <div
                    key={`${contest.type}-${contest.id}`}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-blue-300 transition-colors duration-200"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                      onClick={() =>
                        setExpandedContest(
                          expandedContest === `${contest.type}-${contest.id}`
                            ? null
                            : `${contest.type}-${contest.id}`
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {expandedContest ===
                          `${contest.type}-${contest.id}` ? (
                            <ChevronDown className="h-5 w-5 text-blue-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-blue-500" />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {contest.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                              <Badge variant="outline" className="bg-gray-50">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(contest.date)}
                              </Badge>
                              <Badge variant="outline" className="bg-gray-50">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(contest.date)}
                              </Badge>
                              <Badge variant="outline" className="bg-gray-50">
                                {contest.durationFormatted}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <Badge
                            variant="secondary"
                            className={
                              contest.type === "Codeforces"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {contest.type}
                          </Badge>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {contest.problems.solved}/{contest.problems.total}
                            </div>
                            <div className="text-sm text-gray-600">Solved</div>
                          </div>

                          {contest.type === "Codeforces" ? (
                            <div className="text-right">
                              <div
                                className={`font-semibold ${
                                  contest.rating &&
                                  contest.rating.startsWith("+")
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {contest.rating}
                              </div>
                              <div className="text-sm text-gray-600">
                                Rating
                              </div>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div
                                className={`font-semibold ${getPerformanceColor(
                                  contest.performanceRating
                                )}`}
                              >
                                {contest.performanceRating}
                              </div>
                              <div className="text-sm text-gray-600">
                                Performance
                              </div>
                            </div>
                          )}

                          {contest.rank && (
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">
                                #{contest.rank}
                              </div>
                              <div className="text-sm text-gray-600">Rank</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedContest === `${contest.type}-${contest.id}` && (
                      <div className="border-t bg-gray-50">
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Code className="h-4 w-4 text-blue-500" />
                            Problem Breakdown
                          </h4>
                          {contest.problems.details &&
                          contest.problems.details.length > 0 ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-100">
                                    <TableHead className="font-semibold">
                                      Problem
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                      Rating
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                      Status
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                      Time Spent
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                      {contest.type === "Practice"
                                        ? "Editorial"
                                        : ""}
                                      {contest.type === "Practice" && <br />}
                                      <span className="text-xs text-gray-500">
                                        Attempts
                                      </span>
                                    </TableHead>
                                    <TableHead className="font-semibold"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {contest.problems.details.map((problem) => (
                                    <TableRow
                                      key={`${contest.id}-${problem.id}`}
                                      className="hover:bg-gray-50"
                                    >
                                      <TableCell>
                                        <div>
                                          <span className="font-medium text-gray-900">
                                            {problem.id}
                                          </span>
                                          <p className="text-sm text-gray-600 mt-1">
                                            {problem.title}
                                          </p>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-50"
                                        >
                                          {problem.rating}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          className={getStatusColor(
                                            problem.status
                                          )}
                                        >
                                          {problem.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-gray-700">
                                        {problem.timeSpent}
                                      </TableCell>
                                      <TableCell>
                                        {contest.type === "Practice" && (
                                          <>
                                            {problem.editorialAccessed ? (
                                              <Badge className="bg-yellow-100 text-yellow-800">
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                Accessed
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-gray-100 text-gray-800">
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                Not Accessed
                                              </Badge>
                                            )}
                                          </>
                                        )}
                                        <div className="text-sm text-gray-600 mt-1">
                                          {problem.attempts > 0
                                            ? `${problem.attempts} ${
                                                problem.attempts === 1
                                                  ? "attempt"
                                                  : "attempts"
                                              }`
                                            : "-"}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {contest.type === "Codeforces" ? (
                                          <a
                                            href={getProblemUrl(
                                              problem,
                                              contest.id
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm"
                                          >
                                            View Problem
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        ) : (
                                          <Link
                                            to={getPracticeContestUrl(
                                              contest.id
                                            )}
                                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm"
                                          >
                                            View Details
                                            <ChevronRight className="h-3 w-3" />
                                          </Link>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                              <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                              <p className="text-gray-600">
                                Detailed problem information is not available
                                for this contest.
                              </p>
                            </div>
                          )}
                        </div>

                        {contest.type === "Practice" && (
                          <div className="border-t p-4 bg-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Status: {contest.status}
                              </span>
                            </div>
                            <Link
                              to={`/practice/${contest.id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm font-medium"
                            >
                              View Full Details
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center mt-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="bg-white"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[32px] ${
                          currentPage === page ? "" : "bg-white"
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={currentPage === pagination.totalPages}
                    className="bg-white"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ContestHistoryPage;
