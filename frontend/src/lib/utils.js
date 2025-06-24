import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Scrolls the window to the top with smooth behavior
 */
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/**
 * Creates a function that navigates to a URL and scrolls to top
 * Useful for onClick handlers
 * @param {string} url - The URL to navigate to
 * @param {function} navigate - The navigate function from useNavigate hook
 */
export function navigateAndScrollToTop(url, navigate) {
  return () => {
    navigate(url);
    scrollToTop();
  };
}
