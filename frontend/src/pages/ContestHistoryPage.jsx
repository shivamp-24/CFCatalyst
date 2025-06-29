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
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { userApi } from "@/api/apiService";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const ContestHistoryPage = () => {
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Contest History
            </h1>
            <p className="text-gray-600">
              Track your competitive programming journey
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
            title="Refresh data from Codeforces API"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalContests}
                </div>
                <div className="text-sm text-gray-600">Total Contests</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {Number(stats.averageProblemsPerContest).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">
                  Avg Problems Solved/Contest
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.currentRating}
                </div>
                <div className="text-sm text-gray-600">Current Rating</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getPerformanceColor(
                    stats.lastPerformance
                  )}`}
                >
                  {stats.lastPerformance}
                </div>
                <div className="text-sm text-gray-600">Last Performance</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap gap-4">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="performance-desc">
                      Best Performance
                    </SelectItem>
                    <SelectItem value="performance-asc">
                      Worst Performance
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={contestType} onValueChange={setContestType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Contest Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contests</SelectItem>
                    <SelectItem value="codeforces">Codeforces Only</SelectItem>
                    <SelectItem value="practice">Practice Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share Progress
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contest History List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Contest History ({pagination.totalContests})
              {pagination.totalPages > 1 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : contestHistory.length === 0 ? (
              <div className="text-center py-12">
                <Code className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-lg font-medium text-gray-600">
                  No contests found
                </p>
                <p className="text-gray-500">
                  Participate in Codeforces contests or create practice contests
                  to see your history
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contestHistory.map((contest) => (
                  <div
                    key={`${contest.type}-${contest.id}`}
                    className="border rounded-lg"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
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
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h3 className="font-semibold">{contest.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(contest.date)} at{" "}
                                {formatTime(contest.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {contest.durationFormatted}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">{contest.type}</Badge>
                          <div className="text-right">
                            <div className="font-semibold">
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
                              <div className="font-semibold">
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
                          <h4 className="font-semibold mb-3">
                            Problem Breakdown
                          </h4>
                          {contest.problems.details &&
                          contest.problems.details.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Problem</TableHead>
                                  <TableHead>Rating</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Time Spent</TableHead>
                                  <TableHead>
                                    {contest.type === "Practice"
                                      ? "Editorial"
                                      : ""}
                                    {contest.type === "Practice" && <br />}
                                    <span className="text-xs text-gray-500">
                                      Attempts
                                    </span>
                                  </TableHead>
                                  <TableHead></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {contest.problems.details.map((problem) => (
                                  <TableRow key={`${contest.id}-${problem.id}`}>
                                    <TableCell>
                                      <div>
                                        <span className="font-medium">
                                          {problem.id}
                                        </span>
                                        <p className="text-sm text-gray-600">
                                          {problem.title}
                                        </p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
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
                                    <TableCell>{problem.timeSpent}</TableCell>
                                    <TableCell>
                                      {contest.type === "Practice" && (
                                        <>
                                          {problem.editorialAccessed ? (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                              Accessed
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-gray-100 text-gray-800">
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
                                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                                        >
                                          View{" "}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : (
                                        <Link
                                          to={getPracticeContestUrl(contest.id)}
                                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                                        >
                                          Details{" "}
                                          <ExternalLink className="h-3 w-3" />
                                        </Link>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                              <p>
                                Detailed problem information is not available
                                for this contest.
                              </p>
                            </div>
                          )}
                        </div>

                        {contest.type === "Practice" && (
                          <div className="border-t p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Status: {contest.status}
                              </span>
                            </div>
                            <Link
                              to={`/practice/${contest.id}`}
                              className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                            >
                              View Full Details{" "}
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
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[32px]"
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
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={currentPage === pagination.totalPages}
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
