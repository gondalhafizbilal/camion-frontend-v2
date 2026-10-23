"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { performClientLogout } from "@/services/auth/clientLogout";
import Cookies from "js-cookie";
import {
  useRef,
  useEffect,
  useCallback,
  type RefObject,
  type CSSProperties,
} from "react";
import { isGuestSession } from "@/lib/auth/isGuestClient";

const linkStyle: CSSProperties = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 400,
  fontSize: 14,
  lineHeight: "21px",
  color: "#FAFAFA",
};

type AccountDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
};

export default function AccountDropdown({
  isOpen,
  onClose,
  containerRef,
}: AccountDropdownProps) {
  const t = useTranslations();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const token = Cookies.get("token");
  const allowAccountNavigation = Boolean(token) && !isGuestSession();

  const guardProtectedAccountNavigation = useCallback(
    (_href: string) => (e: { preventDefault: () => void }) => {
      if (allowAccountNavigation) return;
      e.preventDefault();
      onClose();
      router.push("/auth/login");
    },
    [allowAccountNavigation, onClose, router],
  );

  const handleLogout = useCallback(async () => {
    onClose();
    await performClientLogout();
    router.push("/auth/login");
  }, [onClose, router]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target;
      if (
        target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen, onClose, containerRef]);

  if (!isOpen) return null;

  const items: Array<{ label: string; href: string; protected?: boolean }> = [
    { label: t("personalInfo"), href: "/myaccount/personal-info", protected: true },
    { label: t("myOrders"), href: "/myaccount/orders", protected: true },
    {
      label: t("affiliatorDashboard"),
      href: "/myaccount/affiliator-dashboard",
      protected: true,
    },
    {
      label: t("influencerDashboard"),
      href: "/myaccount/influencer-dashboard",
      protected: true,
    },
    { label: t("giveUsFeedback"), href: "/myaccount/feedback", protected: true },
    { label: t("rateUs"), href: "/myaccount/rate", protected: true },
    { label: t("camionChatbot"), href: "/myaccount/chatbot" },
    { label: t("privacyPolicies"), href: "/myaccount/privacy-policies" },
    { label: t("termsOfUse"), href: "/myaccount/terms-conditions" },
    { label: t("help"), href: "/myaccount/help" },
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute z-[200] end-0 top-[calc(100%+8px)] w-[min(225px,calc(100vw-1.5rem))]"
      style={{
        minHeight: 414,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(75px)",
        WebkitBackdropFilter: "blur(75px)",
        borderRadius: 4,
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
      }}
    >
      <div
        className="flex flex-col items-stretch text-start"
        style={{
          padding: "18px 20px",
          gap: 13,
        }}
      >
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            onClick={(e) => {
              if (item.protected) {
                guardProtectedAccountNavigation(item.href)(e);
              }
              onClose();
            }}
            className="flex flex-row items-center justify-start hover:opacity-90 transition-opacity w-full text-start"
            style={{ ...linkStyle, gap: 16 }}
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            if (!allowAccountNavigation) {
              onClose();
              router.push("/auth/login");
              return;
            }
            void handleLogout();
          }}
          className="flex flex-row justify-center items-center mt-auto cursor-pointer border-0 self-stretch max-w-[184px] mx-auto"
          style={{
            height: 40,
            padding: "10px 48px",
            gap: 10,
            background: "#CB262E",
            borderRadius: 4,
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 14,
            lineHeight: "24px",
            color: "#FAFAFA",
            marginTop: 24,
          }}
        >
          {allowAccountNavigation ? t("logout") : t("logIn")}
        </button>
      </div>
    </div>
  );
}
