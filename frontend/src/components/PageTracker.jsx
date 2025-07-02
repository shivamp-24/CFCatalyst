import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { impressionApi } from "../api/adminService";

// This component will track page views
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Record page impression whenever the location changes
    const recordPageView = async () => {
      try {
        await impressionApi.recordImpression(location.pathname);
      } catch (error) {
        // Silent fail - don't disrupt user experience if tracking fails
        console.error("Failed to record page impression:", error);
      }
    };

    recordPageView();
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
};

export default PageTracker;
