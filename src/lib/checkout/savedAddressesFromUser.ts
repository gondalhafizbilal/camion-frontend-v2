import type { AddressDraft } from "@/types/checkoutDisplay";
import type { GqlCustomerAddress } from "@/services/graphql/types/customer";
import {
  countryCallingCodeFromPhone,
  splitInternationalPhone,
} from "@/lib/phone/splitInternationalPhone";

export type SavedShippingAddress = {
  id: string;
  label: string;
  isDefault: boolean;
  draft: AddressDraft;
};

/**
 * After REST set-default, GraphQL `isDefault` can be stale — force UI to match the chosen id.
 */
export function applyDefaultToSavedAddressList(
  list: SavedShippingAddress[],
  defaultId: string,
): SavedShippingAddress[] {
  if (!list.some((a) => a.id === defaultId)) return list;
  return list.map((a) => ({
    ...a,
    isDefault: a.id === defaultId,
  }));
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function rowToDraft(row: Record<string, unknown>): AddressDraft {
  return {
    first_name: pickStr(row, "first_name", "firstName"),
    last_name: pickStr(row, "last_name", "lastName"),
    email: pickStr(row, "email", "emailAddress"),
    phone: pickStr(row, "phone", "phoneNumber"),
    address_1: pickStr(
      row,
      "address_1",
      "address1",
      "street",
      "line1",
      "address_line_1",
    ),
    address_2: pickStr(row, "address_2", "address2", "line2", "address_line_2"),
    country: pickStr(row, "country", "country_code", "countryCode"),
    state: pickStr(row, "state", "region", "province", "city"),
    postcode: pickStr(row, "postcode", "postal_code", "zip", "zipcode"),
  };
}

function defaultFlag(row: Record<string, unknown>): boolean {
  const v =
    row.is_default ??
    row.default ??
    row.isDefault ??
    row.is_primary ??
    row.primary;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

function rowId(row: Record<string, unknown>, index: number): string {
  const id = pickStr(row, "id", "address_id", "uuid", "_id");
  if (id) return id;
  return `addr-${index}`;
}

function summaryLabel(draft: AddressDraft, index: number): string {
  const line =
    draft.streetAddress?.trim() ||
    draft.address_1?.trim() ||
    [draft.city, draft.state, draft.country].filter(Boolean).join(", ") ||
    "";
  const short = line.length > 48 ? `${line.slice(0, 46)}…` : line;
  return short || `Address ${index + 1}`;
}

function collectAddressRows(user: Record<string, unknown>): Record<
  string,
  unknown
>[] {
  const nestedCustomer =
    user.customer && typeof user.customer === "object"
      ? (user.customer as Record<string, unknown>)
      : null;

  const tryArrays: unknown[] = [
    user.addresses,
    user.shipping_addresses,
    user.shippingAddresses,
    nestedCustomer?.addresses,
    nestedCustomer?.shipping_addresses,
  ];

  for (const a of tryArrays) {
    if (!Array.isArray(a) || a.length === 0) continue;
    const rows: Record<string, unknown>[] = [];
    for (const item of a) {
      if (item && typeof item === "object")
        rows.push(item as Record<string, unknown>);
    }
    if (rows.length > 0) return rows;
  }

  const single = user.address;
  if (single && typeof single === "object") {
    return [single as Record<string, unknown>];
  }

  return [];
}

/** Maps `users/me` (and similar) payloads into selectable shipping addresses. */
export function savedAddressesFromUserProfile(
  user: Record<string, unknown> | null | undefined,
): SavedShippingAddress[] {
  if (!user || typeof user !== "object") return [];

  const rows = collectAddressRows(user);
  if (rows.length === 0) return [];

  const mapped: SavedShippingAddress[] = rows.map((row, index) => {
    const draft = rowToDraft(row);
    const isDefault = defaultFlag(row);
    const id = rowId(row, index);
    return {
      id,
      isDefault,
      draft,
      label: summaryLabel(draft, index),
    };
  });

  return mapped;
}

/** Derives legacy first/last from a single full name string. */
export function splitFullNameToLegacy(full: string): {
  first_name: string;
  last_name: string;
} {
  const p = full.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return { first_name: "", last_name: "" };
  if (p.length === 1) return { first_name: p[0]!, last_name: "" };
  return { first_name: p[0]!, last_name: p.slice(1).join(" ") };
}

function splitFullName(fullName: string): { first: string; last: string } {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/** Maps GraphQL `getCustomerAddresses` to the checkout address dropdown shape. */
export function savedAddressesFromCustomerAddresses(
  list: GqlCustomerAddress[] | null | undefined,
): SavedShippingAddress[] {
  const rows = Array.isArray(list) ? list : [];
  if (rows.length === 0) return [];

  const mapped: SavedShippingAddress[] = rows.map((addr, index) => {
    const nameParts = splitFullName(addr.fullName);
    const phoneStr = String(addr.phoneNumber ?? "").trim();
    const { dialCode, national } = splitInternationalPhone(phoneStr);
    const draft: AddressDraft = {
      fullName: String(addr.fullName ?? "").trim(),
      first_name: nameParts.first,
      last_name: nameParts.last,
      countryCode: dialCode || countryCallingCodeFromPhone(addr.phoneNumber),
      phoneLocal: national,
      phone: phoneStr,
      streetAddress: String(addr.streetAddress ?? "").trim(),
      apartment: String(addr.apartment ?? "").trim(),
      zipCode: String(addr.zipCode ?? "").trim(),
      city: String(addr.city ?? "").trim(),
      state: String(addr.state ?? "").trim(),
      country: String(addr.country ?? "").trim(),
      address_1: String(addr.streetAddress ?? "").trim(),
      address_2: String(addr.apartment ?? "").trim(),
      postcode: String(addr.zipCode ?? "").trim(),
    };
    return {
      id: String(addr.uuid || `addr-${index}`),
      isDefault: Boolean(addr.isDefault),
      draft,
      label: summaryLabel(draft, index),
    };
  });

  return mapped;
}

export function mergeUserContactIntoDraft(
  user: Record<string, unknown>,
  draft: AddressDraft,
): AddressDraft {
  const out: AddressDraft = { ...draft };
  const userFull = pickStr(user, "fullName", "full_name", "name");

  if (!out.contactFullName?.trim()) {
    if (draft.fullName?.trim()) out.contactFullName = draft.fullName.trim();
    else if (userFull) out.contactFullName = userFull;
    else
      out.contactFullName = [draft.first_name, draft.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
  }
  const legacy = splitFullNameToLegacy(out.contactFullName ?? "");
  out.first_name = legacy.first_name;
  out.last_name = legacy.last_name;

  if (!out.fullName?.trim() && draft.fullName?.trim()) out.fullName = draft.fullName.trim();
  if (!out.fullName?.trim() && userFull) out.fullName = userFull;

  if (!out.email?.trim())
    out.email = pickStr(user, "email", "emailAddress");
  if (out.phoneLocal?.trim()) {
    out.phone = out.phoneLocal;
  } else if (out.phone?.trim()) {
    out.phone = splitInternationalPhone(out.phone).national;
  } else {
    const p = pickStr(user, "phone", "phoneNumber");
    if (p) out.phone = splitInternationalPhone(p).national;
  }
  return out;
}

export function formatShippingAddressSummary(draft: AddressDraft): string {
  const street = (draft.streetAddress ?? draft.address_1)?.trim();
  const apt = (draft.apartment ?? draft.address_2)?.trim();
  const zip = (draft.zipCode ?? draft.postcode)?.trim();
  const cityState = [draft.city, draft.state].filter(Boolean).join(", ").trim();
  const parts = [
    street,
    apt,
    [cityState, zip].filter(Boolean).join(" ").trim(),
    draft.country?.trim(),
  ].filter((p): p is string => Boolean(p && p.length > 0));
  return parts.join(", ");
}

export function pickDefaultSavedAddressId(
  list: SavedShippingAddress[],
): string | null {
  if (list.length === 0) return null;
  const def = list.find((a) => a.isDefault);
  return (def ?? list[0]).id;
}
