"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "eigenforge-theme";
const THEME_COLORS: Record<Theme, string> = {
  light: "#edf2ee",
  dark: "#09141c",
};

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const initialTheme: Theme =
      storedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  const nextThemeLabel = theme === "light" ? "sombre" : "clair";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Activer le thème ${nextThemeLabel}`}
      aria-pressed={theme === "dark"}
      title={`Activer le thème ${nextThemeLabel}`}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === "light" ? "☀" : "☾"}
      </span>
      <span className="theme-toggle-label">
        {theme === "light" ? "Clair" : "Sombre"}
      </span>
    </button>
  );
}
