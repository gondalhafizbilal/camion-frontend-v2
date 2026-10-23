"use client";
import Footer from "@/componentsedit/layout/footer/footer";
import Header from "@/componentsedit/layout/header/header";
import Image from "@/componentsedit/StaticImage";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/services/api/api";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import { apiFetch } from "@/services/api/apiClient";

export default function Notification() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState([]);
  const savedToken = Cookies.get("token");
  const fcm_token = Cookies.get("fcm_token");
  const { message } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!savedToken) {
        toast.warning(t("notificationsSignInRequired"));

        setTimeout(() => {
          router.push("/auth/signup");
        }, 2000);
        return;
      }
      setLoading(true);
      try {
        const res = await apiFetch(`${API_ENDPOINTS.NOTOC}`, {
          headers: {
            ...(savedToken && { Authorization: `Bearer ${savedToken}` }),
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        setNotif(data);
      } catch (error) {
        console.error("Error fetching notification:", error);
        toast.error(t("notificationsLoadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [savedToken, router, t]);

  // Handle incoming notifications from the service worker
  useEffect(() => {
    if (message) {
      setNotif((prev) => [
        {
          id: Date.now(),
          title: message.notification?.title,
          body: message.notification?.body,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.info(message.notification?.title || t("notificationsNewFallback"));
    }
  }, [message]);

  const totalnotifs = notif.length;

  return (
    <main>
      <Header totalnotifs={totalnotifs} />
      <div className="min-h-auto py-10 px-5 flex justify-center">
        <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-5 space-y-4">
          {loading ? (
            <p className="text-center text-gray-500">
              Loading notifications...
            </p>
          ) : notif.length === 0 ? (
            <p className="text-center text-gray-500">No notifications found.</p>
          ) : (
            notif.map((item) => (
              <div
                key={item.id}
                className="flex justify-between cursor-pointer items-center border-b border-[#F0F0F0] last:border-none pb-3"
              >
                <span className="text-[#B92123] text-2xl">
                  <Image
                    src="/assets/icons/Icon.svg"
                    alt="Notification icon"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </span>
                <div className="flex-1 text-right pr-4">
                  <p className="text-[#6C6C6C] font-semibold text-lg">
                    {item.title}
                  </p>
                  <p className="text-[#000] text-sm">{item.body}</p>
                  <p className="text-[#6C6C6C] text-xs mt-1">
                    {new Date(item.createdAt).toLocaleString("ar-EG", {
                      hour12: false,
                    })}
                  </p>
                </div>

                <div className="w-10 h-10 flex-shrink-0">
                  <Image
                    src="/assets/icons/logo-light.svg"
                    alt="Company Logo"
                    width={40}
                    height={40}
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
