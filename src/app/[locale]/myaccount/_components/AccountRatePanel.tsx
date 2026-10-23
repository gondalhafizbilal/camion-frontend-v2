"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import AccountPanelSurface from "./AccountPanelSurface";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.camiontrading.app";
const APP_STORE_URL =
  "https://apps.apple.com/gh/app/camion-trading-كميون/id6758658533";

function ShoppingBagIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M10.67 10.67V8.67C10.67 5.72 13.05 3.33 16 3.33C18.95 3.33 21.33 5.72 21.33 8.67V10.67"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.67 10.67H25.33L23.73 26.67H8.27L6.67 10.67Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STAR_PATH =
  "M6.83551 1.69606C7.57028 -0.565342 10.7696 -0.565344 11.5043 1.69605L11.9866 3.18017C12.3152 4.1915 13.2576 4.87622 14.321 4.87622H15.8815C18.2592 4.87622 19.2479 7.91891 17.3242 9.31653L16.0617 10.2338C15.2015 10.8588 14.8415 11.9667 15.1701 12.978L15.6523 14.4621C16.3871 16.7235 13.7988 18.604 11.8751 17.2064L10.6127 16.2892C9.75238 15.6641 8.58746 15.6641 7.72718 16.2892L6.46471 17.2064C4.54105 18.604 1.95278 16.7235 2.68755 14.4621L3.16977 12.978C3.49837 11.9667 3.13839 10.8588 2.27811 10.2338L1.01565 9.31654C-0.908016 7.91891 0.0806146 4.87622 2.45839 4.87622H4.01888C5.08225 4.87622 6.02469 4.1915 6.35329 3.18017L6.83551 1.69606Z";

function StarCell({
  index,
  rating,
  onPick,
}: {
  index: number;
  rating: number;
  onPick: (i: number) => void;
}) {
  const filled = rating >= index;

  return (
    <button
      type="button"
      onClick={() => onPick(index)}
      className="border-0 p-0 cursor-pointer shrink-0 bg-transparent flex items-center justify-center w-8 h-8 sm:w-[30px] sm:h-[30px]"
      aria-label={`Rate ${index} out of 5`}
    >
      <svg width="30" height="28.421" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d={STAR_PATH} fill={filled ? "#F7C95F" : "#F0F0F0"} />
      </svg>
    </button>
  );
}

export default function AccountRatePanel() {
  const t = useTranslations();
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const handlePick = (starIndex: number) => {
    setRating(starIndex);
    setSubmitted(false);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    // Encourage store rating with a direct deep link.
    const isIOS =
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/i.test(navigator.userAgent);
    const target = isIOS ? APP_STORE_URL : PLAY_STORE_URL;
    try {
      window.open(target, "_blank", "noopener,noreferrer");
    } catch {
      // ignore; user can still tap the buttons below
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contents">
      <AccountPanelSurface className="items-center text-center min-h-0 lg:min-h-[350px]">
        <div className="w-[50px] h-[50px] rounded-full bg-[#CB262E] flex items-center justify-center mx-auto shrink-0">
          <ShoppingBagIcon />
        </div>

        <div className="flex flex-col items-center gap-2 sm:gap-3 mt-6 w-full max-w-[752px] mx-auto px-1">
          <span className="font-sans font-medium text-base leading-6 text-black text-center">
            {t("rateUs")}
          </span>
          <span className="font-sans font-normal text-xs sm:text-sm leading-[18px] text-black text-center max-w-[520px]">
            {t("rateUsEncourageSubtitle")}
          </span>
        </div>

        <div className="flex flex-row items-center justify-center gap-2 mt-6">
          <span className="w-7 sm:w-8 font-sans font-medium text-lg sm:text-xl leading-[26px] capitalize text-black shrink-0">
            {rating}
          </span>
          <div className="flex flex-row items-center justify-center gap-0 w-[150px] h-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <StarCell key={i} index={i} rating={rating} onPick={handlePick} />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="mt-8 w-full max-w-[704px] h-12 sm:h-[50px] flex flex-row justify-center items-center px-6 bg-[#CB262E] border border-[#CB262E] rounded-[5px] cursor-pointer hover:opacity-90 font-sans font-semibold text-base leading-6 capitalize text-white"
        >
          {t("rateUsCta")}
        </button>

        <div className="mt-3 w-full max-w-[704px] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="h-12 sm:h-[50px] flex flex-row justify-center items-center px-6 rounded-[5px] cursor-pointer hover:bg-black/[0.03] font-sans font-semibold text-base leading-6 text-black border border-black/15"
          >
            {t("googlePlay")}
          </a>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="h-12 sm:h-[50px] flex flex-row justify-center items-center px-6 rounded-[5px] cursor-pointer hover:bg-black/[0.03] font-sans font-semibold text-base leading-6 text-black border border-black/15"
          >
            {t("appStore")}
          </a>
        </div>

        {submitted ? (
          <p className="mt-4 mb-0 w-full max-w-[704px] font-sans font-medium text-xs sm:text-sm leading-[18px] text-[#3D743A]">
            {t("rateUsThanks")}
          </p>
        ) : null}
      </AccountPanelSurface>
    </form>
  );
}
