// Runs before the app starts on the client. Use PerformanceObserver to capture vitals without extra deps.
(function () {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  const send = (metric) => {
    // Simple console reporter; replace with analytics endpoint if desired.
    console.info('[Web Vitals]', metric);
    // Example beacon:
    // navigator.sendBeacon('/vitals', JSON.stringify(metric));
  };

  // CLS
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      send({ name: 'CLS', value: Number(clsValue.toFixed(4)) });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (_) {}

  // LCP
  try {
    let lcpValue = 0;
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        lcpValue = last.renderTime || last.loadTime || last.startTime || 0;
        send({ name: 'LCP', value: Math.round(lcpValue) });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') lcpObserver.disconnect();
    });
  } catch (_) {}

  // INP (if supported)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        send({ name: 'INP', value: Math.round(last.duration) });
      }
    });
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 });
  } catch (_) {}

  // TTFB (first entry of navigation)
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      send({ name: 'TTFB', value: Math.round(nav.responseStart) });
    }
  } catch (_) {}
})();
