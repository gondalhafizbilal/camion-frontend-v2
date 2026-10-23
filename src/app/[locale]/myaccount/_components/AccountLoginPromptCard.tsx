"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

function UserIcon() {
  return (
    <svg width="27" height="24" viewBox="0 0 27 24" fill="none" aria-hidden>
      <path
        d="M13.668 12.018C13.5514 12.0063 13.4114 12.0063 13.283 12.018C10.5064 11.9247 8.29803 9.64634 8.29803 6.84634C8.29803 3.98801 10.6114 1.66634 13.4814 1.66634C16.3397 1.66634 18.6614 3.98801 18.6614 6.84634C18.6497 9.64634 16.4414 11.9247 13.668 12.018Z"
        fill="#FFFFFF"
      />
      <path
        d="M8.04479 15.182C5.22145 17.0754 5.22145 20.162 8.04479 22.0437C11.2531 24.1937 16.5148 24.1937 19.7231 22.0437C22.5464 20.1504 22.5464 17.0637 19.7231 15.182C16.5264 13.0437 11.2648 13.0437 8.04479 15.182Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function WishlistPromptIcon() {
  return (
    <svg
      width={27}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export type AccountLoginPromptCardProps = {
  /** Optional leading icon in the red circle (default: account/user). */
  promptIcon?: "user" | "wishlist";
  /** Optional path to return to after login (passed as `returnTo` query). */
  returnTo?: string;
};

export default function AccountLoginPromptCard({
  promptIcon = "user",
  returnTo,
}: AccountLoginPromptCardProps) {
  const t = useTranslations();
  const loginHref = returnTo
    ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/login";

  return (
    <div className="mx-auto w-full min-w-0">
      <div className="box-border flex w-full min-w-0 flex-col items-center gap-3 rounded-[10px] border border-black/15 bg-white px-4 py-[18px] sm:px-6">
        <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#CB262E]">
          {promptIcon === "wishlist" ? <WishlistPromptIcon /> : <UserIcon />}
        </div>

        <div className="flex w-full max-w-[279px] flex-col gap-2 text-center">
          <h3 className="font-sans text-base font-medium leading-6 text-black">
            {t("loginForBetterExperience")}
          </h3>
          <p className="font-sans text-xs font-normal capitalize leading-[18px] text-black">
            {t("guestCartDescription")}
          </p>
        </div>

        <Link
          href={loginHref}
          className="flex min-h-[50px] w-full shrink-0 flex-row items-center justify-center rounded-[5px] bg-[#CB262E] px-6 py-3 font-sans text-base font-semibold capitalize leading-6 text-white transition-opacity hover:opacity-90 sm:px-[34px]"
        >
          {t("logIn")}
        </Link>
      </div>
    </div>
  );
}

