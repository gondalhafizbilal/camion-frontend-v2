/** Session token from login (email/phone) required for the verify OTP step. */

export const LOGIN_FLOW_TOKEN_KEY = "camion_login_flow_token";

export function setLoginFlowToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOGIN_FLOW_TOKEN_KEY, token);
}

export function getLoginFlowToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(LOGIN_FLOW_TOKEN_KEY);
}

export function clearLoginFlowToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOGIN_FLOW_TOKEN_KEY);
}
