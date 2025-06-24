import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Component that scrolls to the top of the page when the route changes
 * This is an alternative to the useScrollToTop hook and can be used
 * by placing it once at the top level of the application.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // When the pathname changes, scroll to top with smooth behavior
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
