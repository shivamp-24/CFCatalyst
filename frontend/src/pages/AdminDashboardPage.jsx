import { useState, useEffect } from "react";
import { adminApi } from "../api/adminService";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import DashboardLayout from "../components/DashboardLayout";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Fetch initial stats and sync status
  useEffect(() => {
    fetchStats();
    fetchSyncStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch admin statistics",
        variant: "destructive",
      });
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await adminApi.getSyncStatus();
      setSyncStatus(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sync status",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (type) => {
    setIsSyncing(true);
    try {
      let response;
      if (type === "all") {
        response = await adminApi.syncAll();
        toast({
          title: "Success",
          description: "Successfully synced all data from Codeforces",
        });
      } else if (type === "problems") {
        response = await adminApi.syncProblems();
        toast({
          title: "Success",
          description: "Successfully synced problems from Codeforces",
        });
      } else if (type === "contests") {
        response = await adminApi.syncContests();
        toast({
          title: "Success",
          description: "Successfully synced contests from Codeforces",
        });
      }

      // Refresh stats and sync status
      await Promise.all([fetchStats(), fetchSyncStatus()]);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  // Get rating color based on Codeforces rating
  const getRatingColor = (rating) => {
    if (rating === "Legendary Grandmaster") return "text-red-500 font-bold";
    if (rating === "International Grandmaster") return "text-red-500";
    if (rating === "Grandmaster") return "text-red-500";
    if (rating === "Master") return "text-orange-500";
    if (rating === "International Master") return "text-orange-500";
    if (rating === "Candidate Master") return "text-purple-500";
    if (rating === "Expert") return "text-blue-500";
    if (rating === "Specialist") return "text-cyan-500";
    if (rating === "Pupil") return "text-green-500";
    if (rating === "Newbie") return "text-gray-500";
    return "text-gray-500";
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Total Users</h3>
            <p className="text-2xl">{stats?.totalUsers || 0}</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Total Problems</h3>
            <p className="text-2xl">{stats?.totalProblems || 0}</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Total Contests</h3>
            <p className="text-2xl">{stats?.totalContests || 0}</p>
          </Card>
        </div>

        {/* User Statistics Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <h3 className="font-medium mb-2">New Users</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Today:</span>
                  <span className="font-semibold">
                    {stats?.userStats?.newUsersToday || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>This Week:</span>
                  <span className="font-semibold">
                    {stats?.userStats?.newUsersThisWeek || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>This Month:</span>
                  <span className="font-semibold">
                    {stats?.userStats?.newUsersThisMonth || 0}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Active Users</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Today:</span>
                  <span className="font-semibold">
                    {stats?.userStats?.activeUsersToday || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>This Week:</span>
                  <span className="font-semibold">
                    {stats?.userStats?.activeUsersThisWeek || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>This Month:</span>
                  <span className="font-semibold">
                    {stats?.userStats?.activeUsersThisMonth || 0}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Engagement</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Submissions:</span>
                  <span className="font-semibold">
                    {stats?.totalSubmissions || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Practice Contests:</span>
                  <span className="font-semibold">
                    {stats?.totalPracticeContests || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Problems/User:</span>
                  <span className="font-semibold">
                    {stats?.totalUsers && stats?.totalSubmissions
                      ? (stats.totalSubmissions / stats.totalUsers).toFixed(1)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <h3 className="font-medium mb-3">Users by Rating</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {stats?.userStats?.usersByRating?.map((item) => (
              <div
                key={item.rating}
                className="border rounded-md p-2 text-center"
              >
                <div className={`${getRatingColor(item.rating)}`}>
                  {item.rating}
                </div>
                <div className="text-lg font-semibold">{item.count}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Impression Statistics Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Website Traffic</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="border rounded-md p-3 text-center">
              <div className="text-sm text-gray-500">Total Impressions</div>
              <div className="text-2xl font-semibold">
                {stats?.impressionStats?.total || 0}
              </div>
            </div>
            <div className="border rounded-md p-3 text-center">
              <div className="text-sm text-gray-500">Today</div>
              <div className="text-2xl font-semibold">
                {stats?.impressionStats?.today || 0}
              </div>
            </div>
            <div className="border rounded-md p-3 text-center">
              <div className="text-sm text-gray-500">This Week</div>
              <div className="text-2xl font-semibold">
                {stats?.impressionStats?.thisWeek || 0}
              </div>
            </div>
            <div className="border rounded-md p-3 text-center">
              <div className="text-sm text-gray-500">This Month</div>
              <div className="text-2xl font-semibold">
                {stats?.impressionStats?.thisMonth || 0}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <h3 className="font-medium mb-3">Top Pages</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Page</th>
                  <th className="text-right py-2">Impressions</th>
                </tr>
              </thead>
              <tbody>
                {stats?.impressionStats?.byPage?.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.page}</td>
                    <td className="text-right py-2">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sync Status */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Last Sync</h2>
          <div className="space-y-2">
            <p>Problems: {formatDate(syncStatus?.lastProblemSync)}</p>
            <p>Contests: {formatDate(syncStatus?.lastContestSync)}</p>
          </div>
        </Card>

        {/* Sync Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sync Actions</h2>
          <div className="space-y-4">
            {isSyncing && (
              <div className="mb-4">
                <p className="mb-2">Syncing in progress...</p>
                <Progress value={66} className="w-full" />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => handleSync("all")}
                disabled={isSyncing}
                className="flex-1"
              >
                Sync All Data
              </Button>
              <Button
                onClick={() => handleSync("problems")}
                disabled={isSyncing}
                variant="outline"
                className="flex-1"
              >
                Sync Problems Only
              </Button>
              <Button
                onClick={() => handleSync("contests")}
                disabled={isSyncing}
                variant="outline"
                className="flex-1"
              >
                Sync Contests Only
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
