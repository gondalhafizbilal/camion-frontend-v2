"use client";

import type { ReactNode } from "react";
import { ToastViewport } from "./ToastViewport";

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
