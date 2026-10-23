export {};

declare global {
  // SkipCash SDK script exposes `window.SkipCash` with a `mount` function(s).
  // We keep this loosely typed until we align with the SDK's exact public API.
  interface Window {
    SkipCash?: any;
  }
}

