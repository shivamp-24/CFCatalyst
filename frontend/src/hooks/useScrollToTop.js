import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * A custom hook that scrolls the page to the top whenever
 * the route path changes.
 */
export default function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);
}
