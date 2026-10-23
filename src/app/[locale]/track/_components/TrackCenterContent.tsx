"use client";

import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import Roadmap from "@/componentsedit/Roadmap";
import { useUser } from "@/componentsedit/context/UserContext";
import AccountLoginPromptCard from "@/app/[locale]/myaccount/_components/AccountLoginPromptCard";
import { isGuestSession } from "@/lib/auth/isGuestClient";
import TrackOrderPanel from "./TrackOrderPanel";

export default function TrackCenterContent() {
  const t = useTranslations();
  const { user, loading } = useUser();
  const token = Cookies.get("token");
  const isGuest = isGuestSession();
  const shouldShowLoginPrompt = !loading && (!token || !user || isGuest);

  const breadcrumbItems = [
    { label: t("home") || "Home", href: "/" },
    { label: t("trackOrder") || "Track order", href: "/track" },
  ].filter((i) => i.label);

  return (
    <div className="w-full px-4 md:px-10 pt-6 pb-16">
      <div className="mx-auto w-full max-w-[1170px]">
        <Roadmap items={breadcrumbItems} />

        <div className="mt-10 lg:mt-[60px]">
          {shouldShowLoginPrompt ? (
            <AccountLoginPromptCard returnTo="/track" />
          ) : (
            <TrackOrderPanel />
          )}
        </div>
      </div>
    </div>
  );
}
