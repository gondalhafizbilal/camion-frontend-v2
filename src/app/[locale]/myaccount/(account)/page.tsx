"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

const LG_MIN_WIDTH = 1024;

export default function MyAccountHubPage() {
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_MIN_WIDTH}px)`);
    const go = () => {
      if (mq.matches) {
        router.replace("/myaccount/personal-info");
      }
    };
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, [router]);

  return null;
}
