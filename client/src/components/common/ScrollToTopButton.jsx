import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mainContainer = document.getElementById("main-scroll-container");
    
    // If we're not using the custom scroll container, attach to window
    const target = mainContainer || window;

    const toggleVisibility = () => {
      const scrolled = mainContainer 
        ? mainContainer.scrollTop 
        : document.documentElement.scrollTop;
        
      if (scrolled > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    target.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => target.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const mainContainer = document.getElementById("main-scroll-container");
    if (mainContainer) {
      mainContainer.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };

  return (
    <Button
      variant="secondary"
      className={cn(
        "fixed z-[99] rounded-full shadow-lg transition-all duration-300 transform p-0 flex items-center justify-center",
        "bottom-20 right-4 sm:bottom-24 sm:right-8", // Move higher up to avoid overlapping footer
        "h-8 w-8 sm:h-10 sm:w-10", // Size adjustments (now respected without size="icon")
        "bg-secondary/80 hover:bg-secondary backdrop-blur-sm border border-border text-secondary-foreground",
        isVisible 
          ? "translate-y-0 opacity-100 cursor-pointer scale-100" 
          : "translate-y-8 opacity-0 pointer-events-none scale-90"
      )}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
    </Button>
  );
};

export default ScrollToTopButton;
