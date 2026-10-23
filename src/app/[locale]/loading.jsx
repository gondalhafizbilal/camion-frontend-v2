"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader/Loader";

const MIN_DISPLAY_TIME = 500; // milliseconds

export default function Loading() {
  const [progress, setProgress] = useState(10);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(progressTimer); // Stop progress simulation at 90%
          return p;
        }
        const step = p < 40 ? 6 : p < 70 ? 3 : 1;
        return Math.min(90, p + step);
      });
    }, 180);

    const minTimeTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_DISPLAY_TIME);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(minTimeTimer);
    };
  }, []);

  // The actual page content will only start rendering once the data is fetched.
  // This Loading component will be replaced by the page content when it's ready.
  // The progress should conceptually go to 100% when the actual page content is ready to be displayed.
  // For now, we'll just show the loader with simulated progress.
  // The minTimeElapsed ensures the loader is visible for a short period.

  return <Loader progress={progress} label="Loading…" isFullScreen={true} />;
}
