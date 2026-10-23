"use client";

import { useTranslations } from "next-intl";

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 16.92V19.92C22 20.47 21.55 20.92 21 20.92C10.51 20.92 2 12.41 2 1.92C2 1.37 2.45 0.92 3 0.92H6C6.55 0.92 7 1.37 7 1.92V4.92C7 5.27 6.82 5.59 6.52 5.77L4.48 7C5.32 9.78 7.14 12.13 9.5 13.97L10.73 11.93C10.91 11.63 11.23 11.45 11.58 11.45H14.58C15.13 11.45 15.58 11.9 15.58 12.45V15.45C15.58 16 15.13 16.45 14.58 16.45H11.58"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6L10.2 11.4C11.27 12.2 12.73 12.2 13.8 11.4L21 6M5 19H19C20.1 19 21 18.1 21 17V7C21 5.9 20.1 5 19 5H5C3.9 5 3 5.9 3 7V17C3 18.1 3.9 19 5 19Z"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ContactCenterContent() {
  const t = useTranslations();

  return (
    <section className="w-full">
      <div className="w-full max-w-[1170px] mx-auto px-4 lg:px-0 pt-[183px] pb-24 flex flex-col lg:flex-row gap-[30px]">
        <div
          className="w-full lg:w-[340px] bg-white rounded-[4px] shadow-[0px_1px_13px_rgba(0,0,0,0.05)]"
          style={{ minHeight: 457 }}
        >
          <div className="w-full px-[35px] py-10 flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#CB262E] flex items-center justify-center">
                  <PhoneIcon />
                </div>
                <h3 className="font-sans font-medium text-[16px] leading-[24px] text-black">
                  {t("callToUs")}
                </h3>
              </div>
              <div className="flex flex-col gap-4">
                <p className="font-sans font-normal text-[14px] leading-[21px] text-black">
                  {t("contactAvailable247")}
                </p>
                <p className="font-sans font-normal text-[14px] leading-[21px] text-black">
                  {t("contactPhoneText")}
                </p>
              </div>
            </div>

            <div className="w-full border-t border-black/50" />

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#CB262E] flex items-center justify-center">
                  <MailIcon />
                </div>
                <h3 className="font-sans font-medium text-[16px] leading-[24px] text-black">
                  {t("writeToUs")}
                </h3>
              </div>
              <div className="flex flex-col gap-4">
                <p className="font-sans font-normal text-[14px] leading-[21px] text-black">
                  {t("contactReplyWithin24h")}
                </p>
                <p className="font-sans font-normal text-[14px] leading-[21px] text-black">
                  {t("contactEmailSupport")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="w-full lg:w-[800px] bg-white rounded-[4px] shadow-[0px_1px_13px_rgba(0,0,0,0.05)]"
          style={{ minHeight: 457 }}
        >
          <div className="w-full px-[31px] py-10 flex flex-col gap-5">
            <h3 className="font-sans font-semibold text-[18px] leading-[26px] text-black">
              {t("contactNeedHelpTitle")}
            </h3>
            <p className="font-sans font-normal text-[14px] leading-[22px] text-black/80">
              {t("contactNeedHelpBody")}
            </p>
            <div className="mt-2 rounded-[6px] bg-[#FFF8F8] border border-[#CB262E]/20 px-4 py-3">
              <p className="font-sans text-[13px] leading-[20px] text-black/80">
                <span className="font-semibold text-[#CB262E]">
                  {t("contactTipLabel")}
                </span>{" "}
                {t("contactTipBody")}
              </p>
            </div>
          </div>

          {/*
          <form className="w-full px-[31px] py-10 flex flex-col items-end gap-8">
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder={t("contactYourName")}
                className="w-full h-[50px] bg-[#F5F5F5] rounded-[4px] px-4 outline-none font-sans font-normal text-[14px] leading-[24px] text-black placeholder:text-black/50"
              />
              <input
                type="email"
                placeholder={t("contactYourEmail")}
                className="w-full h-[50px] bg-[#F5F5F5] rounded-[4px] px-4 outline-none font-sans font-normal text-[14px] leading-[24px] text-black placeholder:text-black/50"
              />
              <input
                type="tel"
                placeholder={t("contactYourPhone")}
                className="w-full h-[50px] bg-[#F5F5F5] rounded-[4px] px-4 outline-none font-sans font-normal text-[14px] leading-[24px] text-black placeholder:text-black/50"
              />
            </div>

            <textarea
              placeholder={t("contactYourMessage")}
              className="w-full h-[207px] resize-none bg-[#F5F5F5] rounded-[4px] px-4 py-[13px] outline-none font-sans font-normal text-[14px] leading-[24px] text-black placeholder:text-black/50"
            />

            <button
              type="button"
              className="w-[214px] h-[56px] rounded-[4px] bg-[#CB262E] text-[#FAFAFA] font-sans font-medium text-[16px] leading-[24px] hover:opacity-90 transition-opacity"
            >
              {t("sendMessage")}
            </button>
          </form>
          */}
        </div>
      </div>
    </section>
  );
}

