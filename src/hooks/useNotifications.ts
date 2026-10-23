import { useCallback, useEffect, useState } from "react";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { app } from "@/lib/firebase";
import Cookies from "js-cookie";
import { API_ENDPOINTS } from "@/services/api/api";
import { useApiLoader } from "@/hooks/useApiLoader";

export function useNotifications(): {
  fcmToken: string | null;
  message: MessagePayload | null;
  requestPermission: () => Promise<void>;
} {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [message, setMessage] = useState<MessagePayload | null>(null);
  const [messaging, setMessaging] = useState<Messaging | null>(null);

  const apiFetch = useApiLoader();

  const requestPermission = useCallback(async (): Promise<void> => {
    if (!messaging) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Permission not granted for Notification");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      const currentToken = await getToken(messaging, {
        ...(vapidKey ? { vapidKey } : {}),
        serviceWorkerRegistration: registration,
      });
      console.log("FCM Token:", currentToken);

      if (currentToken) {
        setFcmToken(currentToken);
        Cookies.set("fcm_token", currentToken);

        const token = Cookies.get("token");
        if (token) {
          try {
            const response = await apiFetch(API_ENDPOINTS.NOTOCTOCKEN, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ token: currentToken }),
            });

            if (!response.ok) {
              if (response.status === 401) {
                console.warn(
                  "Authentication failed. Token may be expired or invalid.",
                );
                Cookies.remove("token");
              } else {
                console.error(
                  `Failed to save FCM token: ${response.status} ${response.statusText}`,
                );
              }
              try {
                const errorData: unknown = await response.json();
                console.error("Error details:", errorData);
              } catch {
                /* not JSON */
              }
            } else {
              console.log("FCM token saved successfully");
            }
          } catch (fetchError) {
            console.error("Error saving FCM token to server:", fetchError);
          }
        } else {
          console.warn("User not authenticated, cannot save FCM token");
        }
      } else {
        console.log("No registration token available.");
      }
    } catch (err) {
      console.error("An error occurred while retrieving token. ", err);
    }
  }, [messaging, apiFetch]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      console.warn("This browser does not support Firebase Cloud Messaging.");
      return;
    }

    if (!app) {
      console.warn(
        "Firebase app is not initialized. Please configure Firebase environment variables.",
      );
      return;
    }

    try {
      const msg = getMessaging(app);
      setMessaging(msg);

      const unsubscribe = onMessage(msg, (payload) => {
        console.log("Message received. ", payload);
        setMessage(payload);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Error initializing messaging:", err);
    }
  }, []);

  return { fcmToken, message, requestPermission };
}
