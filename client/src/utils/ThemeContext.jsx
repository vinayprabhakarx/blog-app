import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Helper function to get system preference
  const getSystemTheme = () => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  // Helper function to get time-based theme
  const getTimeBasedTheme = () => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6 ? "dark" : "light";
  };

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      return savedTheme;
    }
    return getSystemTheme();
  });

  useEffect(() => {
    const applyTheme = () => {
      localStorage.setItem("theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    };

    if (document.startViewTransition) {
      document.startViewTransition(applyTheme);
    } else {
      document.documentElement.classList.add("theme-transition");
      // Force a reflow so the browser registers the transition class before applying the theme
      void document.documentElement.offsetHeight;
      
      applyTheme();
      
      const timeout = setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Apply system theme
  const setSystemTheme = () => {
    const systemTheme = getSystemTheme();
    setTheme(systemTheme);
    localStorage.setItem("themeMode", "system");
  };

  // Apply time-based theme
  const setTimeBasedTheme = () => {
    const timeTheme = getTimeBasedTheme();
    setTheme(timeTheme);
    localStorage.setItem("themeMode", "time");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setSystemTheme,
        setTimeBasedTheme,
        getSystemTheme,
        getTimeBasedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
