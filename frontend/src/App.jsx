import { Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "./components/ui/toaster";
import useScrollToTop from "./hooks/useScrollToTop";
import PracticePage from "./pages/PracticePage";
import PracticeContestPage from "./pages/PracticeContestPage";

function App() {
  // Use the scroll to top hook
  useScrollToTop();

  return (
    <>
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
          <Route path="/profile" element={<DashboardPage />} />
          <Route path="/settings" element={<DashboardPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
