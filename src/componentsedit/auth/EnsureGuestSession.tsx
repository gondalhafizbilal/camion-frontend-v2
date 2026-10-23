"use client";

import { useEffect } from "react";
import {
  CAMION_SESSION_UPDATED_EVENT,
  ensureGuestSessionIfNeeded,
} from "@/services/auth/guestRegister";

/**
 * Creates a backend guest session when there is no auth token (first visit, post-logout, etc.).
 * Runs once on mount and when the session changes — not on every client navigation.
 */
export default function EnsureGuestSession() {
  useEffect(() => {
    void ensureGuestSessionIfNeeded();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSession = () => void ensureGuestSessionIfNeeded();
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
  }, []);

  return null;
}
