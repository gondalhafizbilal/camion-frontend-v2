import Cookies from "js-cookie";
import { API_ENDPOINTS } from "@/services/api/api";
import { clearLoginFlowToken } from "@/services/auth/loginFlowToken";
import {
  GUEST_DEVICE_COOKIE_NAME,
  clearGuestDeviceIdentity,
  clearGuestRegisterBackoff,
  ensureGuestSessionIfNeeded,
  notifySessionUpdated,
} from "@/services/auth/guestRegister";
/* ---------------- Constants ---------------- */
const AUTH_COOKIE_OPTIONS = { path: "/" as const };

const SESSION_COOKIE_NAMES = [
  "token",
  "id",
  "email",
  "fullName",
  "phone",
  "role",
  "loginType",
  "auth_method",
  GUEST_DEVICE_COOKIE_NAME,
] as const;

function clearLocalAuthCookies(): void {
  for (const name of SESSION_COOKIE_NAMES) {
    Cookies.remove(name, AUTH_COOKIE_OPTIONS);
  }
  clearGuestDeviceIdentity();
  clearLoginFlowToken();
}

/**
 * When cookies still hold a dead bearer (expired customer or guest JWT, etc.), clear them and
 * register a new guest so GraphQL keeps working. No remote logout call.
 */
export async function recoverGuestSessionAfterLostCustomerAuth(): Promise<void> {
  clearGuestRegisterBackoff();
  clearLocalAuthCookies();
  await ensureGuestSessionIfNeeded();
  notifySessionUpdated();
}

/** Calls backend logout when a token exists, then removes auth cookies (always). */
export async function performClientLogout(): Promise<void> {
  const token = Cookies.get("token");
  if (token) {
    try {
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      /* still clear local session */
    }
  }
  clearLocalAuthCookies();
  notifySessionUpdated();
  clearGuestRegisterBackoff();
  void ensureGuestSessionIfNeeded();
}
