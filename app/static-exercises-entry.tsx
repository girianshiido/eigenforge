import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ExerciseLab from "./exercise-lab";
import "./globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Le laboratoire d’exercices est introuvable.");
}

createRoot(root).render(
  <StrictMode>
    <ExerciseLab />
  </StrictMode>,
);

if (
  "serviceWorker" in navigator &&
  window.location.pathname.startsWith("/eigenforge/")
) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/eigenforge/sw.js", {
      scope: "/eigenforge/",
    });
  });
}
