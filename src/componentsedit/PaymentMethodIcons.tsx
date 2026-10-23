"use client";

import type { ComponentType, ReactNode } from "react";

const CARD_WIDTH = 43.75;
const CARD_HEIGHT = 30;

export const PaymentCardBase = ({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) => (
  <div
    className={`flex items-center justify-center flex-shrink-0 box-border bg-white border border-[#D9D9D9] ${className}`}
    style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 5, borderWidth: 1.25 }}
  >
    {children}
  </div>
);

export const MastercardIcon = () => (
  <svg
    width="44"
    height="30"
    viewBox="0 0 44 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
  >
    <rect
      x="0.625"
      y="0.625"
      width="42.5"
      height="28.75"
      rx="4.375"
      fill="white"
      stroke="#D9D9D9"
      strokeWidth="1.25"
    />
    <path
      d="M27.7207 6.25C32.4313 6.25022 36.25 10.1135 36.25 14.8789C36.2499 19.6442 32.4313 23.5076 27.7207 23.5078C25.6086 23.5078 23.6772 22.7287 22.1875 21.4424C20.6978 22.7287 18.7664 23.5078 16.6543 23.5078C11.9437 23.5076 8.12509 19.6442 8.125 14.8789C8.125 10.1135 11.9437 6.25023 16.6543 6.25C18.7663 6.25 20.6978 7.0283 22.1875 8.31445C23.6772 7.02829 25.6087 6.25 27.7207 6.25Z"
      fill="#ED0006"
    />
    <path
      d="M27.7207 6.25C32.4313 6.25022 36.25 10.1135 36.25 14.8789C36.2499 19.6442 32.4313 23.5076 27.7207 23.5078C25.6086 23.5078 23.6772 22.7287 22.1875 21.4424C24.0204 19.8598 25.1845 17.5077 25.1846 14.8789C25.1846 12.2499 24.0206 9.89711 22.1875 8.31445C23.6772 7.02829 25.6087 6.25 27.7207 6.25Z"
      fill="#F9A000"
    />
    <path
      d="M22.1877 8.31378C24.021 9.89644 25.1848 12.2501 25.1848 14.8792C25.1847 17.5079 24.0206 19.8601 22.1877 21.4427C20.3548 19.8601 19.1908 17.508 19.1907 14.8792C19.1907 12.25 20.3544 9.89644 22.1877 8.31378Z"
      fill="#FF5E00"
    />
  </svg>
);

export const VisaIcon = () => (
  <PaymentCardBase>
    <svg
      width="44"
      height="30"
      viewBox="0 0 44 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.625"
        y="0.625"
        width="42.5"
        height="28.75"
        rx="4.375"
        fill="white"
        stroke="#D9D9D9"
        strokeWidth="1.25"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.2816 20.3228H10.6312L8.64369 12.7405C8.54936 12.3917 8.34906 12.0833 8.05443 11.938C7.31914 11.5728 6.5089 11.2821 5.625 11.1355V10.8436H9.89459C10.4839 10.8436 10.9258 11.2821 10.9995 11.7914L12.0307 17.2608L14.6798 10.8436H17.2565L13.2816 20.3228ZM18.7297 20.3228H16.2266L18.2878 10.8436H20.7908L18.7297 20.3228ZM24.0292 13.4696C24.1029 12.9591 24.5448 12.6672 25.0604 12.6672C25.8707 12.5939 26.7533 12.7405 27.4899 13.1044L27.9318 11.0635C27.1952 10.7716 26.385 10.625 25.6497 10.625C23.2203 10.625 21.4525 11.938 21.4525 13.7603C21.4525 15.1466 22.7047 15.8745 23.5886 16.313C24.5448 16.7503 24.9131 17.0422 24.8395 17.4794C24.8395 18.1353 24.1029 18.4272 23.3676 18.4272C22.4837 18.4272 21.5998 18.2086 20.7908 17.8434L20.3489 19.8856C21.2328 20.2495 22.189 20.3961 23.0729 20.3961C25.797 20.4681 27.4899 19.1564 27.4899 17.1875C27.4899 14.7081 24.0292 14.5628 24.0292 13.4696ZM36.25 20.3228L34.2625 10.8436H32.1277C31.6858 10.8436 31.2438 11.1355 31.0965 11.5728L27.4162 20.3228H29.9929L30.5072 18.9378H33.6733L33.9679 20.3228H36.25ZM32.496 13.3964L33.2313 16.9689H31.1702L32.496 13.3964Z"
        fill="#172B85"
      />
    </svg>
  </PaymentCardBase>
);

export const DebitIcon = () => (
  <PaymentCardBase>
    <span
      className="font-bold text-[#0A2540] text-[10px] tracking-wider"
      style={{
        fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
      }}
    >
      DEBIT
    </span>
  </PaymentCardBase>
);

export const AmexIcon = () => (
  <PaymentCardBase className="!bg-[#1F72CD] !border-[#1F72CD]">
    <span
      className="font-bold text-white text-[10px] tracking-wider"
      style={{
        fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
      }}
    >
      AMEX
    </span>
  </PaymentCardBase>
);

export const ApplePayIcon = () => (
  <PaymentCardBase>
    <svg viewBox="0 0 24 24" fill="#000000" className="w-5 h-4" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  </PaymentCardBase>
);

export const GooglePayIcon = () => (
  <PaymentCardBase>
    <svg viewBox="0 0 24 24" className="w-6 h-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  </PaymentCardBase>
);

/** Qatar NAPS — National Automated Payment System. */
export const NapsIcon = () => (
  <PaymentCardBase>
    <svg viewBox="0 0 44 30" className="h-full w-full" aria-hidden>
      <text
        x="22"
        y="18.5"
        textAnchor="middle"
        fill="#8B1A1A"
        fontSize="9"
        fontWeight="700"
        fontFamily="var(--font-montserrat), ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.04em"
      >
        NAPS
      </text>
    </svg>
  </PaymentCardBase>
);

/** QPay (Qatar). */
export const QpayIcon = () => (
  <PaymentCardBase>
    <svg viewBox="0 0 44 30" className="h-full w-full" aria-hidden>
      <text
        x="22"
        y="18.5"
        textAnchor="middle"
        fill="#0067C5"
        fontSize="9"
        fontWeight="700"
        fontFamily="var(--font-montserrat), ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.02em"
      >
        QPay
      </text>
    </svg>
  </PaymentCardBase>
);

/** Cash on Delivery — market-standard stacked banknotes. */
export const CashOnDeliveryIcon = () => (
  <PaymentCardBase>
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="#2E7D32"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Offset stack layers */}
      <path d="M4 8.5h12.5a1.5 1.5 0 0 1 1.5 1.5v1" />
      <path d="M5.5 6h12.5a1.5 1.5 0 0 1 1.5 1.5v1" />
      {/* Front bill */}
      <rect x="2.5" y="10" width="15.5" height="9.5" rx="1.5" fill="#E8F5E9" />
      <circle cx="10.25" cy="14.75" r="2.15" fill="#FFFFFF" />
      <path d="M5 13.25h1.15M14.35 16.25H15.5" />
    </svg>
  </PaymentCardBase>
);

const ICON_MAP: Record<string, ComponentType> = {
  mastercard: MastercardIcon,
  visa: VisaIcon,
  debit: DebitIcon,
  amex: AmexIcon,
  applepay: ApplePayIcon,
  googlepay: GooglePayIcon,
  naps: NapsIcon,
  qpay: QpayIcon,
  cod: CashOnDeliveryIcon,
};

export function PaymentMethodIconByType({ type }: { type: string }) {
  const normalizedType =
    String(type ?? "")
      .trim()
      .toLowerCase() || "visa";
  const Icon = ICON_MAP[normalizedType] ?? VisaIcon;
  return <Icon />;
}

/** Trusted payment badges for footer / marketing surfaces. */
export const TRUSTED_PAYMENT_BADGES = [
  { id: "visa", Icon: VisaIcon },
  { id: "mastercard", Icon: MastercardIcon },
  { id: "applepay", Icon: ApplePayIcon },
  { id: "googlepay", Icon: GooglePayIcon },
  { id: "qpay", Icon: QpayIcon },
] as const;

export function PaymentMethodBadgeRow({
  className = "",
  "aria-label": ariaLabel = "Payment methods",
}: {
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <ul
      className={`m-0 flex list-none flex-wrap items-center gap-2 p-0 ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {TRUSTED_PAYMENT_BADGES.map(({ id, Icon }) => (
        <li key={id} className="shrink-0">
          <Icon />
        </li>
      ))}
    </ul>
  );
}
