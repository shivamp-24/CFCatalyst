import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  // Fetch user profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await userApi.getProfile(user.codeforcesHandle);
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
      setProfile((prev) => ({ ...prev, ...updatedData }));
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
        <h1 className="text-3xl font-bold mb-8">Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              {/* Profile Header with Avatar */}
              <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                {profile?.titlePhoto && (
                  <img
                    src={profile.titlePhoto}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-30"
                  />
                )}
              </div>

              <div className="flex justify-center -mt-16 px-6">
                <div className="relative">
                  <img
                    src={profile?.avatar || "https://via.placeholder.com/100"}
                    alt={profile?.codeforcesHandle || "User"}
                    className="w-32 h-32 rounded-full border-4 border-white bg-white object-cover"
                  />
                  <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-gray-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={refreshCFData}
                      disabled={isRefreshing}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              <CardHeader className="text-center pt-2">
                <CardTitle className="text-2xl">
                  {profile?.name || profile?.codeforcesHandle || "User"}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <span className={getRatingColor(profile?.codeforcesRating)}>
                    {getRankName(profile?.codeforcesRating)}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className={getRatingColor(profile?.codeforcesRating)}>
                    {profile?.codeforcesRating || "Unrated"}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                {!editMode ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {profile?.codeforcesHandle || "No handle"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {profile?.email || "No email"}
                      </span>
                    </div>
                    {profile?.country && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {profile.country}
                        </span>
                      </div>
                    )}
                    {profile?.bio && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Your country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="A short bio about yourself"
                      />
                    </div>
                  </form>
                )}
              </CardContent>

              <CardFooter className="flex justify-center border-t pt-4">
                {!editMode ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      className="w-1/2"
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
                      className="w-1/2"
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
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Codeforces Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Rating</span>
                  <span
                    className={`font-semibold ${getRatingColor(
                      profile?.codeforcesRating
                    )}`}
                  >
                    {profile?.codeforcesRating || "Unrated"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Max Rating</span>
                  <span
                    className={`font-semibold ${getRatingColor(
                      profile?.maxRating
                    )}`}
                  >
                    {profile?.maxRating || "Unrated"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rank</span>
                  <span
                    className={`font-semibold ${getRatingColor(
                      profile?.codeforcesRating
                    )}`}
                  >
                    {getRankName(profile?.codeforcesRating)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Problems Solved</span>
                  <span className="font-semibold">
                    {profile?.solvedProblems?.length || 0}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full"
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
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Contests</CardTitle>
                <CardDescription>
                  Your recent participation in contests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingContests ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : recentContests.length > 0 ? (
                  <div className="space-y-4">
                    {recentContests.map((contest) => (
                      <div
                        key={contest.id || contest._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">
                              {contest.name || contest.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDate(contest.date || contest.createdAt)}
                              </span>
                              {contest.duration && (
                                <>
                                  <span>•</span>
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {formatDuration(contest.duration)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {contest.rank && (
                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                Rank: {contest.rank}
                              </div>
                            )}
                            {contest.score !== undefined && (
                              <div className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Score: {contest.score}
                              </div>
                            )}
                          </div>
                        </div>
                        {contest.problemCount && (
                          <div className="mt-2 text-sm text-gray-600">
                            {contest.problemCount} problems
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent contests found.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Practice Statistics */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">Practice Statistics</CardTitle>
                <CardDescription>
                  Your performance in practice contests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">
                        Practice Contests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-2xl font-bold">
                          {profile?.practiceContestHistory?.length || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">
                        Problems Solved
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-2xl font-bold">
                          {profile?.solvedProblems?.length || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
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
