import { useEffect, useState } from "react";

export function useFakeProgress(active: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(100);
      return;
    }

    setProgress(10);

    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const step = p < 40 ? 10 : p < 70 ? 5 : 2;
        return Math.min(90, p + step);
      });
    }, 100);

    return () => clearInterval(t);
  }, [active]);

  return progress;
}
