"use client";

import type { ReactNode } from "react";

/**
 * Shared white card for my-account inner pages. Desktop look preserved at lg+;
 * tighter padding and no forced min-height on small screens.
 */
export default function AccountPanelSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full max-w-[870px] mx-auto lg:mx-0 flex flex-col box-border bg-white shadow-[0px_1px_13px_rgba(0,0,0,0.05)] rounded-[4px] p-4 sm:p-6 md:p-8 lg:p-10 min-h-0 ${className}`}
    >
      {children}
    </div>
  );
}
