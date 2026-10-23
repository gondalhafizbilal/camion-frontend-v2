import { parsePhoneNumber } from "libphonenumber-js";

/** Body for `POST .../login/phone-number` / resend from stored E.164 (cookie). */
export function phoneLoginJsonFromE164(phoneE164: string): {
  countryCode: string;
  phoneNumber: string;
  e164: string;
} {
  const raw = phoneE164.startsWith("+") ? phoneE164 : `+${phoneE164}`;
  const parsed = parsePhoneNumber(raw);
  if (!parsed?.isValid()) {
    throw new Error("Invalid phone number");
  }
  return {
    countryCode: `+${parsed.countryCallingCode}`,
    phoneNumber: parsed.nationalNumber,
    e164: parsed.format("E.164"),
  };
}
