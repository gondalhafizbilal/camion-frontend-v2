"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useCallback, type ReactNode } from "react";
import { CartProvider } from "@/componentsedit/context/CartContext";
import { UserProvider } from "@/componentsedit/context/UserContext";
import { CategoriesProvider } from "@/componentsedit/context/CategoriesContext";
import { SiteCatalogProvider } from "@/componentsedit/context/SiteCatalogContext";
import { CurrencyProvider } from "@/componentsedit/context/CurrencyContext";
import { MinimumOrderProvider } from "@/componentsedit/context/MinimumOrderContext";
import { FreeShippingProvider } from "@/componentsedit/context/FreeShippingContext";
import {
  ApiLoadingProvider,
  // useApiLoading,
} from "@/componentsedit/context/ApiLoadingContext";
// import Loader from "@/components/Loader/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
// import { useTranslations } from "next-intl";
import { ToastProvider } from "@/componentsedit/toast";
import EnsureGuestSession from "@/componentsedit/auth/EnsureGuestSession";
import { WishlistProductIdsProvider } from "@/componentsedit/context/WishlistProductIdsContext";
import MinimumOrderDockHost from "@/componentsedit/cart/MinimumOrderDockHost";
import CartDrawerHost from "@/componentsedit/cart/CartDrawerHost";
import MobileCartAddedSheetHost from "@/componentsedit/cart/MobileCartAddedSheetHost";
import { MinimumOrderDockProvider } from "@/componentsedit/cart/minimumOrderDockContext";

function ClientLayoutContent({ children }: { children: ReactNode }) {
  // const { isApiLoading, progress } = useApiLoading();
  const { requestPermission } = useNotifications();
  const pathname = usePathname();
  // const t = useTranslations();

  const registerMessaging = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.log("SW registered:", reg);
      await Promise.race([
        requestPermission(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("FCM bootstrap timeout")), 12_000),
        ),
      ]);
    } catch (err) {
      console.error("SW registration failed:", err);
    }
  }, [requestPermission]);

  useEffect(() => {
    void registerMessaging();
  }, [registerMessaging]);

  return (
    <>
      {/* {isApiLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader progress={progress} label={t("loadingData")} isFullScreen={false} />
        </div>
      )} */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className="w-full min-w-0 overflow-x-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function ClientLayout({
  children,
  initialCurrency,
}: {
  children: ReactNode;
  initialCurrency?: string;
}) {
  return (
    <ToastProvider>
      <ApiLoadingProvider>
        <UserProvider>
          <EnsureGuestSession />
          <SiteCatalogProvider>
            <CurrencyProvider initialCurrency={initialCurrency}>
              <MinimumOrderProvider>
                <FreeShippingProvider>
                <CartProvider>
                  <WishlistProductIdsProvider>
                    <CategoriesProvider>
                      <MinimumOrderDockProvider>
                        <ClientLayoutContent>{children}</ClientLayoutContent>
                        <MinimumOrderDockHost />
                        <CartDrawerHost />
                        <MobileCartAddedSheetHost />
                      </MinimumOrderDockProvider>
                    </CategoriesProvider>
                  </WishlistProductIdsProvider>
                </CartProvider>
                </FreeShippingProvider>
              </MinimumOrderProvider>
            </CurrencyProvider>
          </SiteCatalogProvider>
        </UserProvider>
      </ApiLoadingProvider>
    </ToastProvider>
  );
}
