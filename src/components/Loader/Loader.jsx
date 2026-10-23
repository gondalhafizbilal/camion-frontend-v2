// src/components/Loader/Loader.jsx
import Image from "@/componentsedit/StaticImage";
import { useTranslations } from "next-intl";
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const Loader = ({ progress = 0, label = t("loading"), isFullScreen = true }) => {
  const p = clamp(progress, 0, 100);
  const t = useTranslations();
  // Circle math
  const r = isFullScreen ? 20 : 15; // Smaller radius for inline
  const c = 2 * Math.PI * r; // circumference
  const offset = c - (p / 100) * c;

  const containerClasses = `flex items-center justify-center ${
    isFullScreen ? "min-h-screen" : "h-full w-full"
  }`;

  const loaderSizeClass = isFullScreen ? "h-28 w-28" : "h-20 w-20"; // Smaller loader for inline
  const logoWidth = isFullScreen ? 32 : 24;
  const logoHeight = isFullScreen ? 32 : 24;
  const textSizeClass = isFullScreen ? "text-sm" : "text-xs"; // Smaller text for inline

  return (
    <div className={containerClasses}>
      <div className="relative flex flex-col items-center gap-4 animate-fade-in">
        <div className={`relative ${loaderSizeClass}`}>
          <svg
            className={`-rotate-90 ${loaderSizeClass}`}
            viewBox="25 25 50 50"
          >
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#b92124"
              strokeOpacity="0.2"
              strokeWidth="3"
              // className="text-camion-red/20" // Removed
            />

            {/* Progress */}
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#b92124"
              strokeWidth="3.5"
              strokeLinecap="round"
              // className="text-camion-red" // Removed
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 260ms ease",
              }}
            />
          </svg>

          {/* Percentage in center (optional but feels "complete") */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-logo-breathe flex items-center justify-center -ml-0.5">
                <Image
                  src="/assets/icons/logo_c.svg"
                  alt="Loading Camion Animation Logo"
                  width={logoWidth}
                  height={logoHeight}
                  className="object-contain"
                  priority={isFullScreen} // Prioritize loading for full screen
                />
              </div>
              <div
                className={`mt-1 ${textSizeClass} font-semibold text-camion-red tabular-nums`}
              >
                {p}%
              </div>
            </div>
          </div>
        </div>

        <div className={`${textSizeClass} font-medium text-camion-red`}>
          {label}
        </div>
      </div>
    </div>
  );
};

export default Loader;
