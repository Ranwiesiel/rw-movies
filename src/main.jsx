import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style/index.css";
import { ThemeProvider } from "./theme/darkMode.jsx";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
