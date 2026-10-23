import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import { splitInternationalPhone } from "@/lib/phone/splitInternationalPhone";
import type { AddressDraft } from "@/types/checkoutDisplay";

export type CreateCustomerAddressPayload = {
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  streetAddress: string;
  apartment?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
};

/** Same trimming / optional fields as My Account → Addresses `onSaveAddress`. */
export function buildCreateCustomerAddressPayloadFromFields(input: {
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  streetAddress: string;
  apartment: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
}): CreateCustomerAddressPayload {
  return {
    fullName: input.fullName.trim(),
    countryCode: input.countryCode.trim(),
    phoneNumber: input.phoneNumber.trim(),
    streetAddress: input.streetAddress.trim(),
    apartment: input.apartment.trim() || undefined,
    zipCode: input.zipCode.trim() || undefined,
    city: input.city.trim() || undefined,
    state: input.state.trim() || undefined,
    country: input.country.trim() || undefined,
  };
}

function normalizeDialCode(raw: string): string {
  const t = raw.trim();
  if (!t) return "+974";
  return t.startsWith("+") ? t : `+${t.replace(/^\+/, "")}`;
}

/**
 * Maps checkout `AddressDraft` to the REST payload used on My Account addresses.
 * Resolves national `phoneNumber` from `phoneLocal`, or falls back to contact `phone`
 * (national or international) like the account form.
 */
export function addressDraftToCreateCustomerAddressPayload(
  d: AddressDraft,
): CreateCustomerAddressPayload {
  const countryCode = normalizeDialCode(d.countryCode ?? "+974");

  let phoneNumber = (d.phoneLocal ?? "").trim();
  if (!phoneNumber && (d.phone ?? "").trim()) {
    const p = String(d.phone).trim();
    if (p.startsWith("+")) {
      phoneNumber = splitInternationalPhone(p, countryCode).national;
    } else {
      phoneNumber = p;
    }
  }
  if (phoneNumber.startsWith("+")) {
    phoneNumber = splitInternationalPhone(phoneNumber, countryCode).national;
  }

  return buildCreateCustomerAddressPayloadFromFields({
    fullName: (d.fullName ?? "").trim(),
    countryCode,
    phoneNumber,
    streetAddress: (d.streetAddress ?? d.address_1 ?? "").trim(),
    apartment: (d.apartment ?? d.address_2 ?? "").trim(),
    zipCode: (d.zipCode ?? d.postcode ?? "").trim(),
    city: (d.city ?? "").trim(),
    state: (d.state ?? "").trim(),
    country: (d.country ?? "").trim(),
  });
}

/**
 * e.g. `{ "zipCode": "zipCode must be longer than or equal to 5 characters" }`
 * or values that are string arrays / nested message objects.
 */
function collectFieldErrorsMessages(errors: Record<string, unknown>): string[] {
  const parts: string[] = [];
  for (const val of Object.values(errors)) {
    if (typeof val === "string" && val.trim()) {
      parts.push(val.trim());
      continue;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "string" && item.trim()) parts.push(item.trim());
        else if (item && typeof item === "object") {
          const m = (item as Record<string, unknown>).message;
          if (typeof m === "string" && m.trim()) parts.push(m.trim());
        }
      }
    }
  }
  return parts;
}

function parseCustomerAddressApiError(data: unknown, fallback: string): string {
  if (data == null || data === "") return fallback;
  if (typeof data === "string") {
    const s = data.trim();
    return s.length > 0 ? s.slice(0, 800) : fallback;
  }
  if (typeof data !== "object") return fallback;
  const o = data as Record<string, unknown>;

  const errorsRaw = o.errors;
  if (errorsRaw && typeof errorsRaw === "object" && !Array.isArray(errorsRaw)) {
    const msgs = collectFieldErrorsMessages(errorsRaw as Record<string, unknown>);
    if (msgs.length > 0) return msgs.join("; ").slice(0, 800);
  }

  if (Array.isArray(errorsRaw) && errorsRaw.length > 0) {
    const parts = errorsRaw.map((e) => {
      if (typeof e === "string") return e;
      if (e && typeof e === "object") {
        const m = (e as Record<string, unknown>).message;
        if (typeof m === "string") return m;
        const dflt = (e as Record<string, unknown>).defaultMessage;
        if (typeof dflt === "string") return dflt;
      }
      return "";
    });
    const joined = parts.filter(Boolean).join("; ");
    if (joined) return joined.slice(0, 800);
  }

  const pick =
    o.message ?? o.error ?? o.detail ?? o.title ?? o.description;
  if (typeof pick === "string" && pick.trim()) return pick.trim().slice(0, 800);

  const violations = o.violations;
  if (Array.isArray(violations) && violations.length > 0) {
    const parts = violations.map((v) => {
      if (v && typeof v === "object") {
        const m = (v as Record<string, unknown>).message;
        if (typeof m === "string") return m;
      }
      return "";
    });
    const joined = parts.filter(Boolean).join("; ");
    if (joined) return joined.slice(0, 800);
  }

  return fallback;
}

export async function createCustomerAddress(
  payload: CreateCustomerAddressPayload,
  authToken: string,
): Promise<unknown> {
  const res = await apiFetch(API_ENDPOINTS.CUSTOMER_ADDRESSES, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    throw new Error(
      parseCustomerAddressApiError(data, "Failed to create address"),
    );
  }

  return data;
}

export async function updateCustomerAddress(
  addressUuid: string,
  payload: CreateCustomerAddressPayload,
  authToken: string,
): Promise<unknown> {
  const res = await apiFetch(
    `${API_ENDPOINTS.CUSTOMER_ADDRESSES}/${encodeURIComponent(addressUuid)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    throw new Error(
      parseCustomerAddressApiError(data, "Failed to update address"),
    );
  }

  return data;
}

/**
 * Same PATCH as **My Account → Addresses → Set as default** and checkout delivery list:
 * `PATCH .../customer-addresses/{uuid}` with `{ isDefault: true }`.
 */
export function setCustomerAddressAsDefault(
  addressUuid: string,
  authToken: string,
): Promise<unknown> {
  return setDefaultCustomerAddress(addressUuid, true, authToken);
}

export async function setDefaultCustomerAddress(
  addressUuid: string,
  isDefault: boolean,
  authToken: string,
): Promise<unknown> {
  const res = await apiFetch(
    `${API_ENDPOINTS.CUSTOMER_ADDRESSES}/${encodeURIComponent(addressUuid)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ isDefault }),
    },
  );

  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    throw new Error(
      parseCustomerAddressApiError(
        data,
        "Failed to update default address",
      ),
    );
  }

  return data;
}

