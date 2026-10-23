import type { ReactNode } from "react";
import { API_ENDPOINTS } from "@/services/api/api";

const ICON_SIZE = 24;

type SocialMediaLinksProps = {
  /** White icons for dark backgrounds; black icons for light backgrounds. */
  variant?: "onDark" | "onLight";
  className?: string;
};

function iconColor(variant: "onDark" | "onLight") {
  return variant === "onDark" ? "#FFFFFF" : "#000000";
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="shrink-0 hover:opacity-80"
    >
      {children}
    </a>
  );
}

function IconFacebook({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={ICON_SIZE}
      height={ICON_SIZE}
      fill={color}
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconInstagram({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={ICON_SIZE}
      height={ICON_SIZE}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="18" cy="6" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}

function IconLinkedin({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={ICON_SIZE}
      height={ICON_SIZE}
      fill={color}
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
    </svg>
  );
}

function IconTiktok({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={ICON_SIZE}
      height={ICON_SIZE}
      fill={color}
      aria-hidden
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function IconSnapchat({ color }: { color: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={ICON_SIZE}
      height={ICON_SIZE}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <title>Snapchat</title>
      <path
        fill={color}
        d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"
      />
    </svg>
  );
}

function IconYoutube({ color }: { color: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={ICON_SIZE}
      height={ICON_SIZE}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <title>YouTube</title>
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
        fill={color}
      />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    key: "facebook",
    href: () => API_ENDPOINTS.FACEBOOK,
    Icon: IconFacebook,
    label: "Facebook",
  },
  {
    key: "instagram",
    href: () => API_ENDPOINTS.INSTAGRAM,
    Icon: IconInstagram,
    label: "Instagram",
  },
  {
    key: "linkedin",
    href: () => API_ENDPOINTS.LINKEDIN,
    Icon: IconLinkedin,
    label: "LinkedIn",
  },
  { key: "tiktok", href: () => API_ENDPOINTS.TIKTOK, Icon: IconTiktok, label: "TikTok" },
  {
    key: "snapchat",
    href: () => API_ENDPOINTS.SNAP_CHAT,
    Icon: IconSnapchat,
    label: "Snapchat",
  },
  {
    key: "youtube",
    href: () => API_ENDPOINTS.YOUTUBE,
    Icon: IconYoutube,
    label: "YouTube",
  },
] as const;

export default function SocialMediaLinks({
  variant = "onDark",
  className = "",
}: SocialMediaLinksProps) {
  const color = iconColor(variant);

  return (
    <div className={`flex flex-wrap items-center gap-3 sm:gap-3.5 ${className}`.trim()}>
      {SOCIAL_LINKS.map(({ key, href, Icon, label }) => (
        <SocialLink key={key} href={href()} label={label}>
          <Icon color={color} />
        </SocialLink>
      ))}
    </div>
  );
}
