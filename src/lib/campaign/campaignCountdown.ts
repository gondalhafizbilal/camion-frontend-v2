export type CampaignCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export type CampaignTiming = {
  startsAt?: string | null;
  finishesAt?: string | null;
};

export function parseCampaignInstant(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** True when `now` is within [`startsAt`, `finishesAt`) when those bounds exist. */
export function isCampaignCountdownActive(
  timing: CampaignTiming,
  nowMs = Date.now(),
): boolean {
  const end = parseCampaignInstant(timing.finishesAt);
  if (end === null || nowMs >= end) return false;
  const start = parseCampaignInstant(timing.startsAt);
  if (start !== null && nowMs < start) return false;
  return true;
}

export function getCampaignCountdownParts(
  finishesAt: string | null | undefined,
  nowMs = Date.now(),
): CampaignCountdownParts | null {
  const end = parseCampaignInstant(finishesAt);
  if (end === null) return null;

  let remainingMs = end - nowMs;
  if (remainingMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, expired: false };
}

export function formatCampaignCountdown(parts: CampaignCountdownParts): string {
  const totalHours = parts.days * 24 + parts.hours;
  return `${totalHours}h : ${parts.minutes}m : ${parts.seconds}s`;
}

export type CartCampaignEndsUnit = "days" | "hours" | "minutes";

/** Compact cart urgency label unit + count (prefers whole days when ≥ 1). */
export function getCartCampaignEndsFormat(
  finishesAt: string | null | undefined,
  nowMs = Date.now(),
): { unit: CartCampaignEndsUnit; count: number } | null {
  const parts = getCampaignCountdownParts(finishesAt, nowMs);
  if (!parts || parts.expired) return null;
  if (parts.days > 0) return { unit: "days", count: parts.days };
  if (parts.hours > 0) return { unit: "hours", count: parts.hours };
  return { unit: "minutes", count: Math.max(1, parts.minutes) };
}

/** Chevron tip width (px) for the campaign progress arrow overlay. */
export const CAMPAIGN_PROGRESS_CHEVRON_PX = 7;

/**
 * Elapsed fraction through the campaign window [0, 1].
 * When `startsAt` is missing, returns a stable mid progress for display.
 */
export function getCampaignElapsedProgress(
  timing: CampaignTiming,
  nowMs = Date.now(),
): number {
  const end = parseCampaignInstant(timing.finishesAt);
  if (end === null || nowMs >= end) return 1;

  const start = parseCampaignInstant(timing.startsAt);
  if (start === null || end <= start) return 0.4;

  if (nowMs <= start) return 0;
  return Math.min(1, Math.max(0, (nowMs - start) / (end - start)));
}

/** Maps elapsed progress to the darker arrow width (% of bar), keeping countdown visible. */
export function getCampaignProgressWidthPercent(
  timing: CampaignTiming,
  nowMs = Date.now(),
): number {
  const progress = getCampaignElapsedProgress(timing, nowMs);
  const min = 32;
  const max = 82;
  return min + progress * (max - min);
}

export function campaignProgressChevronClipPath(chevronPx = CAMPAIGN_PROGRESS_CHEVRON_PX): string {
  return `polygon(0 0, calc(100% - ${chevronPx}px) 0, 100% 50%, calc(100% - ${chevronPx}px) 100%, 0 100%)`;
}
