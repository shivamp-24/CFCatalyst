import { Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "./components/ui/toaster";
import useScrollToTop from "./hooks/useScrollToTop";
import PracticePage from "./pages/PracticePage";
import PracticeContestPage from "./pages/PracticeContestPage";
import ProfilePage from "./pages/ProfilePage";
import ContestHistoryPage from "./pages/ContestHistoryPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import PageTracker from "./components/PageTracker";

function App() {
  // Use the scroll to top hook
  useScrollToTop();

  return (
    <>
      <PageTracker />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route
            path="/practice/:contestId"
            element={<PracticeContestPage />}
          />
          <Route path="/problems" element={<DashboardPage />} />
          <Route path="/contests" element={<DashboardPage />} />
          <Route path="/leaderboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/contest-history" element={<ContestHistoryPage />} />
          <Route path="/settings" element={<DashboardPage />} />

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
