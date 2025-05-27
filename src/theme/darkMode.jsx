import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useState } from "react";
import { safeGetItem, safeSetItem } from "../utils/StorageHandler";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      safeGetItem("theme") === "dark" ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches &&
        !safeGetItem("theme"))
    );
  });
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      safeSetItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      safeSetItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
export const useTheme = () => useContext(ThemeContext);
