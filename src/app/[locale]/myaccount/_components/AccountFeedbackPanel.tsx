"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import AccountPanelSurface from "./AccountPanelSurface";

export default function AccountFeedbackPanel() {
  const t = useTranslations();
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitted(true);
    setFeedback("");
  };

  return (
    <form onSubmit={handleSubmit} className="contents">
      <AccountPanelSurface className="min-h-0 lg:min-h-[382px]">
        <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444] m-0 mb-4">
          {t("giveUsFeedback")}
        </h1>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t("trackReviewFeedbackPlaceholder")}
          className="w-full max-w-[710px] min-h-[140px] sm:min-h-[188px] box-border resize-y p-4 rounded-[5px] border border-black/15 outline-none font-sans text-xs sm:text-sm leading-[18px] text-black"
        />

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 w-full max-w-[710px]">
          <button
            type="submit"
            className="w-full sm:w-[210px] h-12 flex flex-row justify-center items-center px-6 bg-[#CB262E] rounded-[5px] border-0 cursor-pointer hover:opacity-90 font-sans font-semibold text-base leading-6 capitalize text-white"
          >
            {t("submitFeedback")}
          </button>
        </div>

        {submitted ? (
          <p className="mt-4 mb-0 font-sans font-medium text-xs sm:text-sm leading-[18px] text-[#3D743A]">
            {t("reviewSubmitted")}
          </p>
        ) : null}
      </AccountPanelSurface>
    </form>
  );
}
