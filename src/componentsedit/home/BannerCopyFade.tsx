"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

const COPY_TRANSITION = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };

type BannerCopyFadeProps = {
  slideKey: string | number;
  children: ReactNode;
  className?: string;
};

export default function BannerCopyFade({
  slideKey,
  children,
  className,
}: BannerCopyFadeProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slideKey}
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={COPY_TRANSITION}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
