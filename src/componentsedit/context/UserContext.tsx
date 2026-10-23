"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { fetchCurrentCustomer } from "@/services/graphql";
import type { GqlCurrentCustomer } from "@/services/graphql/types/customer";
import { isGuestSession } from "@/lib/auth/isGuestClient";
import { recoverGuestSessionAfterLostCustomerAuth } from "@/services/auth/clientLogout";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import { cacheRead, cacheWrite, cacheRemove, runWhenIdle } from "@/lib/storageTtlCache";

export type UserProfile = Record<string, unknown>;

/** Maps GraphQL `getCurrentCustomer` to the loose profile shape used across the app (headers, checkout fallbacks). */
function gqlCurrentCustomerToUserProfile(c: GqlCurrentCustomer): UserProfile {
  const email = String(c.emailAddress ?? "").trim();
  const full = String(c.fullName ?? "").trim();
  const given = full.includes(" ") ? full.slice(0, full.indexOf(" ")) : full;
  const phone = String(c.phoneNumber ?? "").trim();
  const at = email.indexOf("@");
  const username = at > 0 ? email.slice(0, at) : email;
  return {
    uuid: c.uuid,
    fullName: full,
    emailAddress: email,
    phoneNumber: phone,
    email,
    phone,
    name: full,
    first_name: given || full,
    username,
  } as UserProfile;
}

type UserContextValue = {
  user: UserProfile | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

const USER_CACHE_VERSION = 1;
const USER_CACHE_TTL_MS = 2 * 60 * 1000; // 2m (keeps header snappy, avoids repeated calls)
const USER_CACHE_KEY = "camion_current_user_v1";

function userCacheKeyForToken(token: string): string {
  const t = String(token || "");
  const authMethod = Cookies.get("auth_method") || "";
  const loginType = Cookies.get("loginType") || "";
  return `${USER_CACHE_KEY}:${authMethod}:${loginType}:${t.length}:${t.slice(0, 6)}:${t.slice(-6)}`;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        cacheRemove(window.sessionStorage, USER_CACHE_KEY);
      }
      return;
    }

    const userCacheKey = userCacheKeyForToken(token);
    if (typeof window !== "undefined") {
      cacheRemove(window.sessionStorage, USER_CACHE_KEY);
      const cached = cacheRead<UserProfile | null>(window.sessionStorage, userCacheKey, {
        version: USER_CACHE_VERSION,
      });
      if (cached.value && !cached.expired) {
        setUser(cached.value);
        setLoading(false);
        return;
      }
    }

    if (isGuestSession()) {
      setLoading(true);
      try {
        const { getCurrentCustomer } = await fetchCurrentCustomer(token);
        if (getCurrentCustomer) {
          const profile = gqlCurrentCustomerToUserProfile(getCurrentCustomer);
          setUser(profile);
          if (typeof window !== "undefined") {
            cacheWrite(window.sessionStorage, userCacheKey, profile, {
              version: USER_CACHE_VERSION,
              ttlMs: USER_CACHE_TTL_MS,
            });
          }
        } else {
          /**
           * Expired guest JWTs often return `getCurrentCustomer: null` without UNAUTHENTICATED,
           * so `authRejected` stays false — still refresh guest so GraphQL has a valid bearer.
           */
          setUser(null);
          if (typeof window !== "undefined") {
            cacheRemove(window.sessionStorage, userCacheKey);
          }
          await recoverGuestSessionAfterLostCustomerAuth();
        }
      } catch (error) {
        console.error("UserContext: guest session validate error", error);
        setUser(null);
        if (typeof window !== "undefined") {
          cacheRemove(window.sessionStorage, userCacheKey);
        }
        await recoverGuestSessionAfterLostCustomerAuth();
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const { getCurrentCustomer, authRejected } = await fetchCurrentCustomer(token);
      if (!getCurrentCustomer) {
        setUser(null);
        if (typeof window !== "undefined") {
          cacheRemove(window.sessionStorage, userCacheKey);
        }
        if (authRejected) {
          /** Stale customer JWT: clear cookies and obtain guest token so GraphQL keeps working. */
          await recoverGuestSessionAfterLostCustomerAuth();
        }
      } else {
        const profile = gqlCurrentCustomerToUserProfile(getCurrentCustomer);
        setUser(profile);
        if (typeof window !== "undefined") {
          cacheWrite(window.sessionStorage, userCacheKey, profile, {
            version: USER_CACHE_VERSION,
            ttlMs: USER_CACHE_TTL_MS,
          });
        }
      }
    } catch (error) {
      console.error("UserContext: fetchCurrentCustomer error", error);
      setUser(null);
      if (typeof window !== "undefined") {
        cacheRemove(window.sessionStorage, userCacheKey);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cancel = runWhenIdle(() => void fetchUser(), 900);
    return cancel;
  }, [fetchUser]);

  useEffect(() => {
    const onSessionUpdate = () => void fetchUser();
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSessionUpdate);
    return () =>
      window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSessionUpdate);
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, loading, refetchUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}

