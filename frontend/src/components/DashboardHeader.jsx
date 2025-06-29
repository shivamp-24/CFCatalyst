import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Trophy,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Activity,
  Calendar,
  Loader2,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

const DashboardHeader = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const profileDropdownRef = useRef(null);

  // Get first letter of handle for avatar fallback
  const userInitial = user?.codeforcesHandle
    ? user.codeforcesHandle[0].toUpperCase()
    : "U";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownRef]);

  // Navigation links
  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/practice", label: "Practice" },
    { path: "/problems", label: "Problems" },
    { path: "/contests", label: "Contests" },
    { path: "/contest-history", label: "History" },
    { path: "/leaderboard", label: "Leaderboard" },
  ];

  // Check if a link is active
  const isActive = (path) => location.pathname === path;

  // Get user rating color based on Codeforces rating
  const getUserRatingColor = () => {
    const rating = user?.codeforcesRating || 0;

    if (rating < 1200)
      return {
        bg: "bg-gray-500",
        text: "text-gray-500",
        border: "border-gray-500",
      }; // Newbie
    if (rating < 1400)
      return {
        bg: "bg-green-500",
        text: "text-green-500",
        border: "border-green-500",
      }; // Pupil
    if (rating < 1600)
      return {
        bg: "bg-cyan-500",
        text: "text-cyan-500",
        border: "border-cyan-500",
      }; // Specialist
    if (rating < 1900)
      return {
        bg: "bg-blue-500",
        text: "text-blue-500",
        border: "border-blue-500",
      }; // Expert
    if (rating < 2100)
      return {
        bg: "bg-violet-500",
        text: "text-violet-500",
        border: "border-violet-500",
      }; // Candidate Master
    if (rating < 2400)
      return {
        bg: "bg-orange-500",
        text: "text-orange-500",
        border: "border-orange-500",
      }; // Master
    if (rating < 2600)
      return {
        bg: "bg-orange-500",
        text: "text-orange-500",
        border: "border-orange-500",
      }; // International Master
    if (rating < 3000)
      return {
        bg: "bg-red-500",
        text: "text-red-500",
        border: "border-red-500",
      }; // Grandmaster
    return { bg: "bg-red-500", text: "text-red-500", border: "border-red-500" }; // International Grandmaster
  };

  const ratingColor = getUserRatingColor();

  // Render avatar based on availability
  const renderAvatar = (size = "normal") => {
    const sizeClasses =
      size === "large"
        ? "w-12 h-12 text-lg"
        : size === "medium"
        ? "w-10 h-10"
        : "w-8 h-8";

    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={`${user?.codeforcesHandle}'s avatar`}
          className={`${sizeClasses} rounded-full object-cover border-2 border-white shadow-sm`}
        />
      );
    }

    return (
      <div
        className={`${sizeClasses} ${ratingColor.bg} rounded-full flex items-center justify-center text-white font-medium shadow-sm ring-2 ring-white`}
      >
        {userInitial}
      </div>
    );
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo - consistent with HomePage */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="relative overflow-hidden rounded-full p-1.5 bg-gray-50 transition-all duration-300 group-hover:bg-gray-100 group-hover:shadow-md">
            <Trophy className="h-7 w-7 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className="text-xl font-bold text-gray-900 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-blue-600 after:transition-all after:duration-300 group-hover:after:w-full">
            CFCatalyst
          </span>
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative py-1.5 px-1 ${
                isActive(link.path)
                  ? "text-blue-600 font-medium"
                  : "text-gray-600 hover:text-blue-600"
              } transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:transform after:scale-x-0 after:transition-transform after:duration-300 ${
                isActive(link.path)
                  ? "after:scale-x-100"
                  : "hover:after:scale-x-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                profileDropdownOpen
                  ? `${ratingColor.border} bg-gray-50`
                  : "border-gray-200"
              } hover:bg-gray-50 transition-all duration-200`}
              aria-label="Open user menu"
            >
              {renderAvatar()}
              <span
                className={`text-sm font-medium ${
                  profileDropdownOpen ? ratingColor.text : "text-gray-700"
                }`}
              >
                {user?.codeforcesHandle || "User"}
              </span>
              <ChevronDown
                className={`h-4 w-4 ${
                  profileDropdownOpen ? ratingColor.text : "text-gray-500"
                } transition-transform duration-200 ${
                  profileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200 transform origin-top-right transition-all duration-200 ease-out">
                {/* Header with user info */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    {renderAvatar("large")}
                    <div>
                      <div
                        className={`font-medium text-base ${ratingColor.text}`}
                      >
                        {user?.codeforcesHandle || "User"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {user?.email || "user@example.com"}
                      </div>
                      {user?.codeforcesRating && (
                        <div className="text-xs font-medium mt-1">
                          Rating:{" "}
                          <span className={ratingColor.text}>
                            {user.codeforcesRating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-2">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3 text-gray-500" />
                    Your Profile
                  </Link>
                  <Link
                    to="/activity"
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Activity className="h-4 w-4 mr-3 text-gray-500" />
                    Activity Log
                  </Link>
                  <Link
                    to="/schedule"
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Calendar className="h-4 w-4 mr-3 text-gray-500" />
                    Contest Schedule
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-500" />
                    Settings
                  </Link>
                </div>

                {/* Sign out button */}
                <div className="border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="flex flex-col px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`py-3 px-2 ${
                  isActive(link.path)
                    ? "text-blue-600 font-medium bg-blue-50 rounded-md"
                    : "text-gray-700 hover:bg-gray-50 rounded-md"
                } transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="flex items-center gap-3 py-3 px-2">
                {renderAvatar("medium")}
                <div>
                  <div className={`font-medium ${ratingColor.text}`}>
                    {user?.codeforcesHandle || "User"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email || "user@example.com"}
                  </div>
                </div>
              </div>
              <Link
                to="/profile"
                className="flex items-center py-3 px-2 text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4 mr-2 text-gray-500" />
                Your Profile
              </Link>
              <Link
                to="/activity"
                className="flex items-center py-3 px-2 text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Activity className="h-4 w-4 mr-2 text-gray-500" />
                Activity Log
              </Link>
              <Link
                to="/settings"
                className="flex items-center py-3 px-2 text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-4 w-4 mr-2 text-gray-500" />
                Settings
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center py-3 px-2 text-red-600 hover:bg-gray-50 rounded-md mt-1"
              >
                <LogOut className="h-4 w-4 mr-2 text-red-500" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
