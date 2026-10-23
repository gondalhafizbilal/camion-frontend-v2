"use client";

import type { ReactNode } from "react";
import { PRODUCT_GRID_CLASS } from "@/lib/styles/carouselCardLayout";

/**
 * Shared product grid — responsive columns via `.product-listing-grid` in globals.css.
 */
export const productGridClassName = PRODUCT_GRID_CLASS;

export default function ProductGrid({ children }: { children: ReactNode }) {
  return <div className={PRODUCT_GRID_CLASS}>{children}</div>;
}
