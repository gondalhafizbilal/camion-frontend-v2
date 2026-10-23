"use client";

import { useTranslations } from "next-intl";

const DeliveryIcon = () => (
  <svg width={40} height={40} viewBox="0 0 40 40" fill="none" className="flex-shrink-0">
    <path d="M11.67 31.67a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28.33 31.67a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.33 28.33H7a1.67 1.67 0 01-1.67-1.67v-4.66M3.33 8.33h16.33a1.67 1.67 0 011.67 1.67v18M15 28.33h10M31.67 28.33h1.33a1.67 1.67 0 001.67-1.67v-8M33.34 18.33H20M33.34 18.33l-4.42-7.36a1.67 1.67 0 00-1.42-.8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 11.82h6.67M1.82 15.45h6.66M5 19.09h6.67" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ReturnIcon = () => (
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_2809_10402)">
<path d="M33.3334 18.3333C32.9258 15.4004 31.5652 12.6828 29.4611 10.5991C27.3571 8.51554 24.6263 7.18152 21.6895 6.80258C18.7527 6.42363 15.7728 7.02079 13.2088 8.50206C10.6447 9.98334 8.63883 12.2665 7.50008 15M6.66675 8.33332V15H13.3334" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M6.66675 21.6667C7.07435 24.5996 8.43497 27.3172 10.539 29.4008C12.6431 31.4844 15.3738 32.8185 18.3106 33.1974C21.2474 33.5763 24.2274 32.9792 26.7914 31.4979C29.3554 30.0166 31.3613 27.7334 32.5001 25M33.3334 31.6667V25H26.6667" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</g>
<defs>
<clipPath id="clip0_2809_10402">
<rect width="40" height="40" fill="white"/>
</clipPath>
</defs>
</svg>

);

export default function DeliveryReturnCard() {
  const t = useTranslations();

  return (
    <div
      className="box-border flex w-full min-w-0 max-w-full flex-col text-black"
      style={{
        minHeight: 120,
        border: "1px solid rgba(0, 0, 0, 0.5)",
        borderRadius: 4,
      }}
    >
      <div
        className="flex flex-row items-center"
        style={{ padding: "10px 16px", gap: 12 }}
      >
        <div className="text-black">
          <DeliveryIcon />
        </div>
        <span
          className="font-sans font-medium text-[#000000]"
          style={{ fontSize: 16, lineHeight: "24px" }}
        >
          {t("freeDelivery")}
        </span>
      </div>
      <div
        className="w-full flex-shrink-0"
        style={{
          height: 0,
          borderTop: "1px solid #000000",
          opacity: 0.5,
        }}
      />
      <div
        className="flex flex-row items-center"
        style={{ padding: "10px 16px", gap: 12, flex: 1 }}
      >
        <div className="text-black">
          <ReturnIcon />
        </div>
        <span
          className="font-sans font-medium text-[#000000]"
          style={{ fontSize: 16, lineHeight: "24px" }}
        >
          {t("returnDelivery")}
        </span>
      </div>
    </div>
  );
}
