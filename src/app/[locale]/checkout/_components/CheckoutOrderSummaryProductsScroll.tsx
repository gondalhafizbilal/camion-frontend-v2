"use client";

import type { ReactNode } from "react";

const VISIBLE_ITEM_COUNT = 6;
// Desktop scroll cap: 6 × 120px items + 5 × 20px gaps = 820px (xl:max-h-[820px])

type CheckoutOrderSummaryProductsScrollProps = {
  itemCount: number;
  children: ReactNode;
};

export default function CheckoutOrderSummaryProductsScroll({
  itemCount,
  children,
}: CheckoutOrderSummaryProductsScrollProps) {
  const isScrollableOnDesktop = itemCount > VISIBLE_ITEM_COUNT;

  return (
    <div
      className={`box-border mb-6 flex min-h-[432px] flex-col rounded-[10px] border border-black/15 p-4${isScrollableOnDesktop ? " xl:min-h-0" : ""}`}
    >
      <div
        className={`flex flex-col gap-5${isScrollableOnDesktop ? " xl:max-h-[820px] xl:overflow-y-auto xl:pr-0.5" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
