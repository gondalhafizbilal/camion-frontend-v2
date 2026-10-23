"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function NotFoundCenterContent() {
  const t = useTranslations();

  return (
    <section
      className="flex w-full justify-center px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 md:px-10 md:pb-20 md:pt-14"
      aria-labelledby="not-found-heading"
    >
      <div className="flex w-full flex-col items-center gap-8 sm:gap-10 md:gap-12">
        <div className="flex w-full max-w-[847px] flex-col items-center text-center">
          <h1
            id="not-found-heading"
            className="flex w-full flex-col items-center gap-3 sm:gap-4"
          >
            <span
              className="font-sans text-[clamp(4.5rem,18vw,8.5rem)] font-bold leading-none tracking-tight text-black"
              aria-hidden
            >
              404
            </span>
            <span className="font-sans text-base font-semibold text-black sm:text-lg">
              {t("pageNotFoundHeading")}
            </span>
          </h1>
          <p
            className="mt-4 max-w-md text-center font-sans text-xs leading-relaxed text-black/65 sm:mt-6 sm:text-sm"
          >
            {t("pageNotFoundHint")}
          </p>
        </div>

        <Link
          href="/"
          className="flex h-12 w-full max-w-[255px] items-center justify-center rounded-[4px] bg-[#CB262E] px-6 font-sans text-sm font-medium leading-6 text-[#FAFAFA] transition-opacity hover:opacity-90 sm:h-14 sm:text-base"
        >
          {t("backToHomepage")}
        </Link>
      </div>
    </section>
  );
}
