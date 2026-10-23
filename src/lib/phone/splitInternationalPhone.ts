import { parsePhoneNumber } from "libphonenumber-js";

const DEFAULT_DIAL = "+974";

export type SplitInternationalPhone = {
  dialCode: string;
  /** National significant number (no country prefix). */
  national: string;
};

/**
 * Splits a stored international number (e.g. "+974 12345678") for combobox + local input.
 * Safe when GraphQL addresses omit a separate `countryCode` field.
 */
export function splitInternationalPhone(
  phone: string | null | undefined,
  fallbackDial = DEFAULT_DIAL,
): SplitInternationalPhone {
  const raw = String(phone ?? "").trim();
  if (!raw) return { dialCode: fallbackDial, national: "" };

  for (const candidate of [raw, raw.replace(/\s+/g, "")]) {
    try {
      const parsed = parsePhoneNumber(candidate);
      if (parsed) {
        return {
          dialCode: `+${parsed.countryCallingCode}`,
          national: parsed.nationalNumber,
        };
      }
    } catch {
      /* invalid for this candidate */
    }
  }

  const loose = raw.match(/^\+([\d]{1,4})\s+(.+)$/);
  if (loose) {
    return {
      dialCode: `+${loose[1]}`,
      national: loose[2]!.replace(/\s/g, ""),
    };
  }

  return { dialCode: fallbackDial, national: raw.replace(/^\+/, "") };
}

export function countryCallingCodeFromPhone(
  phone: string | null | undefined,
  fallbackDial = DEFAULT_DIAL,
): string {
  return splitInternationalPhone(phone, fallbackDial).dialCode;
}
