import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "./page";
import "./globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Le point de montage d’EIGENFORGE est introuvable.");
}

createRoot(root).render(
  <StrictMode>
    <Home />
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
