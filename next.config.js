const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function parsePositiveInt(env, fallback) {
  const n = Number(env);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

const homeHtmlSMaxAge = parsePositiveInt(process.env.HOME_HTML_S_MAXAGE_SECONDS, 300);
const homeHtmlStaleWhileRevalidate = parsePositiveInt(
  process.env.HOME_HTML_STALE_WHILE_REVALIDATE_SECONDS,
  homeHtmlSMaxAge * 2,
);
/** Locale is in the URL (/en vs /ar); avoid shared caches treating responses as interchangeable. */
const homeHtmlCacheControl = `public, s-maxage=${homeHtmlSMaxAge}, stale-while-revalidate=${homeHtmlStaleWhileRevalidate}, must-revalidate`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // output: "export",
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.7rfatk.com",
      },
      {
        protocol: "https",
        hostname: "assets.dev.camiontrading.com",
      },
      {
        protocol: "https",
        hostname: "assets.camiontrading.com",
      },
      {
        protocol: "https",
        hostname: "comio-artifacts.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "camion-woocommerce-media.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "camion-bkt.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/robots", destination: "/robots.txt" },
      { source: "/sitemap", destination: "/sitemap.xml" },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    // Domains required so GTM can load GA4 / Google Ads tags (Tag Coverage).
    // See: https://developers.google.com/tag-platform/security/guides/csp
    const googleTagScriptSrc = [
      "https://www.googletagmanager.com",
      "https://tagmanager.google.com",
      "https://www.google-analytics.com",
      "https://www.googleadservices.com",
      "https://www.google.com",
      "https://pagead2.googlesyndication.com",
      "https://googleads.g.doubleclick.net",
    ].join(" ");
    const googleTagImgSrc = [
      "https://*.google-analytics.com",
      "https://*.googletagmanager.com",
      "https://www.googletagmanager.com",
      "https://*.g.doubleclick.net",
      "https://www.googleadservices.com",
      "https://www.google.com",
      "https://google.com",
      "https://pagead2.googlesyndication.com",
    ].join(" ");
    const googleTagConnectSrc = [
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
      "https://*.g.doubleclick.net",
      "https://www.googleadservices.com",
      "https://googleads.g.doubleclick.net",
      "https://pagead2.googlesyndication.com",
      "https://ad.doubleclick.net",
      "https://www.google.com",
      "https://google.com",
    ].join(" ");
    const googleTagFrameSrc = [
      "https://www.googletagmanager.com",
      "https://tagassistant.google.com",
      "https://td.doubleclick.net",
    ].join(" ");

    // Base directives
    const baseDirectives = [
      "default-src 'self'",
      // Scripts: relax in dev, tighten in prod (no 'unsafe-eval')
      isProd
        ? `script-src 'self' 'unsafe-inline' https://www.gstatic.com ${googleTagScriptSrc} https://www.gstatic.com/firebasejs https://connect.facebook.net https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com https://sdk.skipcash.com https://*.skipcash.com https://api.skipcash.app https://skipcashtest.azurewebsites.net https://flex.cybersource.com https://testflex.cybersource.com`
        : `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com ${googleTagScriptSrc} https://www.gstatic.com/firebasejs https://connect.facebook.net http://localhost:* http://127.0.0.1:* https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com https://sdk.skipcash.com https://*.skipcash.com https://api.skipcash.app https://skipcashtest.azurewebsites.net https://flex.cybersource.com https://testflex.cybersource.com`,
      // Styles: keep inline allowed for simplicity
      "style-src 'self' 'unsafe-inline'",
      // Images (+ Google Ads / GA4 pixels fired via GTM)
      `img-src 'self' data: blob: https://www.7rfatk.com https://www.facebook.com https://assets.dev.camiontrading.com https://assets.camiontrading.com https://comio-artifacts.s3.us-east-1.amazonaws.com https://camion-woocommerce-media.s3.amazonaws.com https://camion-bkt.s3.us-east-1.amazonaws.com https://*.s3.amazonaws.com ${googleTagImgSrc} https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com`,
      // Fonts
      "font-src 'self' data: https://fonts.gstatic.com",
      // XHR/WebSockets: add localhost/ws in dev for HMR
      isProd
        ? `connect-src 'self' https://app.camiontrading.com https://app.dev.camiontrading.com https://www.gstatic.com ${googleTagConnectSrc} https://www.facebook.com https://connect.facebook.net https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://firebase.googleapis.com https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com https://sdk.skipcash.com https://*.skipcash.com https://api.skipcash.app https://skipcashtest.azurewebsites.net https://*.run.app https://*.on.aws https://flex.cybersource.com https://testflex.cybersource.com https://centinelapi.cardinalcommerce.com https://centinelapistag.cardinalcommerce.com`
        : `connect-src 'self' http://localhost:* http://127.0.0.1:* ws: https://app.camiontrading.com https://app.dev.camiontrading.com https://www.gstatic.com ${googleTagConnectSrc} https://www.facebook.com https://connect.facebook.net https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://firebase.googleapis.com https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com https://sdk.skipcash.com https://*.skipcash.com https://api.skipcash.app https://skipcashtest.azurewebsites.net https://*.run.app https://*.on.aws https://flex.cybersource.com https://testflex.cybersource.com https://centinelapi.cardinalcommerce.com https://centinelapistag.cardinalcommerce.com`,
      // Frames and others
      `frame-src ${googleTagFrameSrc} https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com https://sdk.skipcash.com https://*.skipcash.com https://api.skipcash.app https://skipcashtest.azurewebsites.net https://flex.cybersource.com https://testflex.cybersource.com https://centinelapi.cardinalcommerce.com https://centinelapistag.cardinalcommerce.com`,
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://centinelapi.cardinalcommerce.com https://centinelapistag.cardinalcommerce.com https://*.cardinalcommerce.com",
    ];

    if (isProd) {
      baseDirectives.push("upgrade-insecure-requests");
    }

    const csp = baseDirectives.join("; ");

    // Contact page needs Zendesk widget script + its dependent resources.
    // Keep it scoped to /{locale}/contact so the rest of the site stays tighter.
    const contactDirectives = baseDirectives.map((d) => {
      if (d.startsWith("script-src ")) {
        return `${d} https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com`;
      }
      if (d.startsWith("connect-src ")) {
        return `${d} https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com`;
      }
      if (d.startsWith("frame-src ")) {
        return `${d} https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com`;
      }
      if (d.startsWith("img-src ")) {
        return `${d} https://static.zdassets.com https://ekr.zdassets.com https://*.zdassets.com https://*.zendesk.com https://*.zopim.com`;
      }
      return d;
    });
    const contactCsp = contactDirectives.join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy", value: csp },
      // Only send HSTS in production over HTTPS
      ...(isProd
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
          ]
        : []),
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    // IMPORTANT: put the catch-all first, then override for specific routes.
    // When multiple header rules match, Next may apply the later one last.
    return [
      {
        source: "/en",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: homeHtmlCacheControl },
        ],
      },
      {
        source: "/ar",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: homeHtmlCacheControl },
        ],
      },
      { source: "/:path*", headers: securityHeaders },
      {
        // e.g. /en/contact, /ar/contact
        source: "/:locale/contact",
        headers: [{ key: "Content-Security-Policy", value: contactCsp }],
      },
      {
        source: "/firebase-messaging-sw.js",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
