/** Set on the client before OAuth; read on callback so guest cart can merge. */
export const OAUTH_GUEST_UUID_COOKIE = "oauth_guest_uuid";

export const OAUTH_GUEST_UUID_MAX_MS = 15 * 60 * 1000;

export function clearOauthGuestUuidSetCookie(isHttps: boolean): string {
  let line = `${OAUTH_GUEST_UUID_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  if (isHttps) line += "; Secure";
  return line;
}
