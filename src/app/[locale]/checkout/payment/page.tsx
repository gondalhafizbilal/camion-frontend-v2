"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import RootLayout from "@/componentsedit/layout/RootLayout";
import { useTranslations } from "next-intl";

/** Payment step merged into `/checkout` — keep route as a redirect for old links. */
export default function PaymentPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";

  useEffect(() => {
    router.replace(`/${locale}/checkout`);
  }, [locale, router]);

  return (
    <RootLayout>
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="font-sans">{t("loading")}</p>
      </div>
    </RootLayout>
  );
}
