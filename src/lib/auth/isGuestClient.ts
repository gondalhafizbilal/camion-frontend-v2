import Cookies from "js-cookie";

/** True when the user continued as guest (not a full customer account). */
export function isGuestSession(): boolean {
  if (typeof window === "undefined") return false;
  return (
    Cookies.get("loginType") === "guest" ||
    Cookies.get("auth_method") === "guest"
  );
}

/**
 * Anonymous guest session stores the provisional customer UUID in the `id` cookie
 * (see `persistGuestAuthCookies`). Send it as `guestUUID` on register/login so the API can merge.
 */
export function getGuestUuidForCustomerAuth(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (!isGuestSession()) return undefined;
  const id = Cookies.get("id")?.trim();
  return id || undefined;
}
