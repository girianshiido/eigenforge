"use client";

import { useEffect } from "react";

export function useInteractionGuards() {
  useEffect(() => {
    const preventGesture = (event: Event) => event.preventDefault();
    const preventPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    const preventTrackpadZoom = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault();
    };
    const nonPassive = { passive: false } as AddEventListenerOptions;

    document.addEventListener("gesturestart", preventGesture, nonPassive);
    document.addEventListener("gesturechange", preventGesture, nonPassive);
    document.addEventListener("gestureend", preventGesture, nonPassive);
    document.addEventListener("touchmove", preventPinch, nonPassive);
    document.addEventListener("wheel", preventTrackpadZoom, nonPassive);
    document.addEventListener("dblclick", preventGesture, nonPassive);

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventPinch);
      document.removeEventListener("wheel", preventTrackpadZoom);
      document.removeEventListener("dblclick", preventGesture);
    };
  }, []);
}
