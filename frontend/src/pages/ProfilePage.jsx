import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  MapPin,
  Edit,
  Save,
  X,
  RefreshCw,
  Award,
  TrendingUp,
  Calendar,
  Clock,
  ExternalLink,
  History,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/DashboardLayout";
import useAuth from "@/hooks/useAuth";
import { userApi } from "@/api/apiService";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    country: "",
  });
  const [recentContests, setRecentContests] = useState([]);
  const [isLoadingContests, setIsLoadingContests] = useState(false);

  // Calculate total problems solved in practice contests
  const calculatePracticeProblemsSolved = (practiceHistory) => {
    if (!Array.isArray(practiceHistory)) return 0;

    return practiceHistory.reduce((total, contest) => {
      if (!contest.problems || !Array.isArray(contest.problems)) return total;
      return (
        total + contest.problems.filter((problem) => problem.solved).length
      );
    }, 0);
  };

  // Fetch user profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await userApi.getProfile(user.codeforcesHandle);

        // Debug the profile data
        console.log("Profile data:", profileData);
        console.log("solvedProblems:", profileData.solvedProblems);

        setProfile(profileData);
        setFormData({
          name: profileData.name || "",
          email: profileData.email || "",
          bio: profileData.bio || "",
          country: profileData.country || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  // Fetch recent contests
  useEffect(() => {
    const fetchRecentContests = async () => {
      try {
        setIsLoadingContests(true);
        const data = await userApi.getRecentContests(5);
        setRecentContests(data);
      } catch (error) {
        console.error("Failed to fetch recent contests:", error);
      } finally {
        setIsLoadingContests(false);
      }
    };

    if (user) {
      fetchRecentContests();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsUpdating(true);
      await userApi.updateProfile(formData);

      // Update the profile state with new data
      setProfile((prev) => ({ ...prev, ...formData }));

      setEditMode(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const refreshCFData = async () => {
    try {
      setIsRefreshing(true);
      const updatedData = await userApi.updateCFData();
      setProfile((prev) => ({
        ...prev,
        ...updatedData,
      }));

      toast({
        title: "Success",
        description: "Codeforces data refreshed successfully",
      });
    } catch (error) {
      console.error("Failed to refresh Codeforces data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh Codeforces data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
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

  // Format duration from seconds to hours and minutes
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get color based on Codeforces rating
  const getRatingColor = (rating) => {
    if (!rating) return "text-gray-500";
    if (rating < 1200) return "text-gray-500"; // Newbie
    if (rating < 1400) return "text-green-500"; // Pupil
    if (rating < 1600) return "text-cyan-500"; // Specialist
    if (rating < 1900) return "text-blue-500"; // Expert
    if (rating < 2100) return "text-violet-500"; // Candidate Master
    if (rating < 2400) return "text-orange-500"; // Master
    if (rating < 2600) return "text-orange-500"; // International Master
    if (rating < 3000) return "text-red-500"; // Grandmaster
    return "text-red-600"; // International Grandmaster / Legendary Grandmaster
  };

  // Get badge color based on Codeforces rating
  const getRatingBadgeColor = (rating) => {
    if (!rating) return "bg-gray-100 text-gray-700";
    if (rating < 1200) return "bg-gray-100 text-gray-700"; // Newbie
    if (rating < 1400) return "bg-green-100 text-green-700"; // Pupil
    if (rating < 1600) return "bg-cyan-100 text-cyan-700"; // Specialist
    if (rating < 1900) return "bg-blue-100 text-blue-700"; // Expert
    if (rating < 2100) return "bg-violet-100 text-violet-700"; // Candidate Master
    if (rating < 2400) return "bg-orange-100 text-orange-700"; // Master
    if (rating < 2600) return "bg-orange-100 text-orange-700"; // International Master
    if (rating < 3000) return "bg-red-100 text-red-700"; // Grandmaster
    return "bg-red-100 text-red-700"; // International Grandmaster / Legendary Grandmaster
  };

  // Get rank name based on rating
  const getRankName = (rating) => {
    if (!rating) return "Unrated";
    if (rating < 1200) return "Newbie";
    if (rating < 1400) return "Pupil";
    if (rating < 1600) return "Specialist";
    if (rating < 1900) return "Expert";
    if (rating < 2100) return "Candidate Master";
    if (rating < 2400) return "Master";
    if (rating < 2600) return "International Master";
    if (rating < 3000) return "Grandmaster";
    if (rating < 4000) return "International Grandmaster";
    return "Legendary Grandmaster";
  };

  // Get count safely from various data structures
  const getCountSafely = (data) => {
    // Special case for directly checking profile.solvedProblems
    if (data === profile?.solvedProblems) {
      console.log("Direct solvedProblems access:", data);
    }

    if (!data) {
      return 0;
    }

    if (Array.isArray(data)) {
      return data.length;
    }

    if (typeof data === "number") {
      return data;
    }

    // If it's an object with a count property
    if (data && typeof data === "object") {
      if ("count" in data) {
        return data.count;
      }

      // If it's an object that might have a length property
      if ("length" in data) {
        return data.length;
      }
    }

    // If it's a string that can be parsed as a number
    if (typeof data === "string" && !isNaN(parseInt(data))) {
      return parseInt(data);
    }

    // Last resort: try to convert to a number
    const num = Number(data);
    if (!isNaN(num)) {
      return num;
    }

    return 0;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              {/* Profile Header with Avatar */}
              <div className="relative h-36 bg-gradient-to-r from-blue-600 to-purple-700">
                {profile?.titlePhoto && (
                  <img
                    src={profile.titlePhoto}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-20"
                  />
                )}
              </div>

              <div className="flex justify-center -mt-16 px-6">
                <div className="relative">
                  <img
                    src={profile?.avatar || "https://via.placeholder.com/100"}
                    alt={profile?.codeforcesHandle || "User"}
                    className="w-32 h-32 rounded-full border-4 border-white bg-white object-cover shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600"
                      onClick={refreshCFData}
                      disabled={isRefreshing}
                      title="Refresh Codeforces data"
                    >
                      <RefreshCw
                        className={`h-5 w-5 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              <CardHeader className="text-center pt-2">
                <CardTitle className="text-2xl font-bold">
                  {profile?.name || profile?.codeforcesHandle || "User"}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 mt-2">
                  <Badge
                    className={getRatingBadgeColor(profile?.codeforcesRating)}
                  >
                    {getRankName(profile?.codeforcesRating)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getRatingColor(profile?.codeforcesRating)}
                  >
                    {profile?.codeforcesRating || "Unrated"}
                  </Badge>
                </CardDescription>
              </CardHeader>

              <CardContent>
                {!editMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                      <User className="h-5 w-5 text-blue-500" />
                      <span className="text-gray-700 font-medium">
                        {profile?.codeforcesHandle || "No handle"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <span className="text-gray-700">
                        {profile?.email || "No email"}
                      </span>
                    </div>
                    {profile?.country && (
                      <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <span className="text-gray-700">{profile.country}</span>
                      </div>
                    )}
                    {profile?.bio && (
                      <>
                        <Separator className="my-4" />
                        <div className="p-2 rounded-md bg-gray-50">
                          <p className="text-gray-700 italic">{profile.bio}</p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700">
                        Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your email"
                        className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-gray-700">
                        Country
                      </Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Your country"
                        className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-gray-700">
                        Bio
                      </Label>
                      <Input
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="A short bio about yourself"
                        className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </form>
                )}
              </CardContent>

              <CardFooter className="flex justify-center border-t pt-4">
                {!editMode ? (
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      className="w-1/2 border-gray-200 hover:bg-gray-50"
                      onClick={() => {
                        setEditMode(false);
                        // Reset form data to current profile values
                        setFormData({
                          name: profile?.name || "",
                          email: profile?.email || "",
                          bio: profile?.bio || "",
                          country: profile?.country || "",
                        });
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-1/2 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleSubmit}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>

            {/* Codeforces Stats Card */}
            <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-blue-500" />
                  Codeforces Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <span className="text-gray-700 flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      Current Rating
                    </Badge>
                  </span>
                  <span
                    className={`font-semibold text-lg ${getRatingColor(
                      profile?.codeforcesRating
                    )}`}
                  >
                    {profile?.codeforcesRating || "Unrated"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <span className="text-gray-700 flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      Max Rating
                    </Badge>
                  </span>
                  <span
                    className={`font-semibold text-lg ${getRatingColor(
                      profile?.maxRating
                    )}`}
                  >
                    {profile?.maxRating || "Unrated"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <span className="text-gray-700 flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      Rank
                    </Badge>
                  </span>
                  <span
                    className={`font-semibold ${getRatingColor(
                      profile?.codeforcesRating
                    )}`}
                  >
                    {getRankName(profile?.codeforcesRating)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <span className="text-gray-700 flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      Problems Solved
                    </Badge>
                  </span>
                  <span className="font-semibold text-lg text-blue-600">
                    {Array.isArray(profile?.solvedProblems)
                      ? profile.solvedProblems.length
                      : 0}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full bg-white border-gray-200 hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                  onClick={() =>
                    window.open(
                      `https://codeforces.com/profile/${profile?.codeforcesHandle}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Codeforces
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <History className="h-5 w-5 mr-2 text-blue-500" />
                    Recent Contests
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Your recent participation in contests
                  </CardDescription>
                </div>
                <Button
                  onClick={() => navigate("/contest-history")}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  View Full History
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingContests ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : recentContests.length > 0 ? (
                  <div className="space-y-4">
                    {recentContests.map((contest) => (
                      <div
                        key={contest.id || contest._id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          if (contest.type === "Codeforces") {
                            window.open(
                              `https://codeforces.com/contest/${contest.id}`,
                              "_blank"
                            );
                          } else {
                            navigate(`/practice/${contest.id}`);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              {contest.name || contest.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span>
                                  {formatDate(
                                    contest.date || contest.createdAt
                                  )}
                                </span>
                              </span>
                              {contest.duration && (
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                  <Clock className="h-4 w-4 text-green-500" />
                                  <span>
                                    {formatDuration(contest.duration)}
                                  </span>
                                </span>
                              )}
                              <Badge className="ml-1" variant="outline">
                                {contest.type || "Practice"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {contest.rank && (
                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                                Rank: {contest.rank}
                              </div>
                            )}
                            {contest.score !== undefined && (
                              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                                Score: {contest.score}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          {contest.problemCount && (
                            <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                              {contest.problemCount} problems
                            </div>
                          )}
                          <div className="flex items-center text-blue-600 text-sm hover:underline">
                            <span>View details</span>
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Award className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-lg font-medium text-gray-700">
                      No recent contests found
                    </p>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto">
                      Participate in Codeforces contests or create practice
                      contests to see your activity here.
                    </p>
                    <Button
                      className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => navigate("/practice")}
                    >
                      Start a Practice Contest
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Practice Statistics */}
            <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                  Practice Statistics
                </CardTitle>
                <CardDescription className="mt-1">
                  Your performance in practice contests and problems
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2 border-blue-100 bg-blue-50/40 shadow-sm hover:shadow transition-all duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">
                        Practice Contests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Award className="h-6 w-6 text-blue-600 mr-3" />
                        <span className="text-3xl font-bold text-blue-700">
                          {Array.isArray(profile?.practiceContestHistory)
                            ? profile.practiceContestHistory.length
                            : 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-100 bg-green-50/40 shadow-sm hover:shadow transition-all duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">
                        Practice Problems Solved
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                        <span className="text-3xl font-bold text-green-700">
                          {calculatePracticeProblemsSolved(
                            profile?.practiceContestHistory
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-700 mb-3">
                      Want to improve your skills?
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => navigate("/practice")}
                      >
                        Start Practice Contest
                      </Button>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() =>
                          window.open(
                            "https://codeforces.com/contests",
                            "_blank"
                          )
                        }
                      >
                        Upcoming Contests
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
