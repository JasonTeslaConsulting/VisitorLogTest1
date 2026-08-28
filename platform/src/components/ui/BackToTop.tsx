import { useState, useEffect } from "react";
import { PiArrowUp } from "react-icons/pi";
import { Button } from "@framework/components/ui/button";

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 rounded-full border transition-opacity"
      aria-label="Back to top"
    >
      <PiArrowUp className="h-5 w-5" />
    </Button>
  );
};
