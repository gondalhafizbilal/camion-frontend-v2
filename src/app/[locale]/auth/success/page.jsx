"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Cookies from "js-cookie";
import { API_ENDPOINTS } from "@/services/api/api";
import { consumeAuthReturnTo } from "@/lib/auth/authReturnToClient";
import { buildLocalizedPathname } from "@/lib/auth/authReturnTo";

export default function OAuthSuccess() {
  const router = useRouter();
  const locale = useLocale();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      setStatus("error");
      setMessage(
        error === "account_conflict"
          ? "This Google account is already linked to another user."
          : "Authentication failed. Please try again."
      );
      return;
    }

    (async () => {
      try {
        let res = await apiFetch(API_ENDPOINTS.USER_PROFILE, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          res = await apiFetch(API_ENDPOINTS.AUTH_ME, {
            method: "GET",
            credentials: "include",
          });
        }

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(
            `Session verification failed (${res.status}). Check console for details.`
          );
        }

        const data = await res.json();

        // Chrome requires SameSite attribute for cookies
        const isSecure =
          typeof window !== "undefined" &&
          window.location.protocol === "https:";
        const cookieOptions = {
          expires: 7,
          path: "/",
          sameSite: "Lax",
        };
        if (isSecure) {
          cookieOptions.secure = true;
        }

        Cookies.set("id", data.id, cookieOptions);
        Cookies.set("email", data.email, cookieOptions);
        if (data.fullName) {
          Cookies.set("fullName", data.fullName, cookieOptions);
        }
        if (data.phone) {
          Cookies.set("phone", data.phone, cookieOptions);
        }
        Cookies.set("auth_method", "oauth", cookieOptions);

        if (data.accessToken) {
          Cookies.set("token", data.accessToken, cookieOptions);
        }
        const roleVal =
          data.role != null ? String(data.role).trim() : "";
        if (roleVal) {
          Cookies.set("role", roleVal, cookieOptions);
        } else {
          Cookies.remove("role", { path: "/" });
        }

        setStatus("success");
        setTimeout(() => {
          const path = consumeAuthReturnTo("/");
          window.location.href = buildLocalizedPathname(locale, path);
        }, 500);
      } catch (e) {
        console.error("Session verification error:", e);
        setStatus("error");
        setMessage(e.message || "Unable to verify your session.");
      }
    })();
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {status === "verifying" && <p>Verifying your session…</p>}
      {status === "error" && (
        <div className="text-center space-y-3">
          <p className="text-red-600">{message}</p>
          <button
            onClick={() => router.replace("/auth/login")}
            className="px-4 py-2 bg-[#B92123] text-white rounded"
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}
