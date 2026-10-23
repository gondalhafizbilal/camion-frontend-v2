import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import type { GqlAffiliateBankAccount } from "@/services/graphql";

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null;
}

function firstApiErrorMessage(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;
  const msg = data.message ?? data.error;
  if (typeof msg === "string" && msg.trim()) return msg;
  const errors = data.errors;
  if (errors && typeof errors === "object") {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(v) && v[0] != null) return String(v[0]);
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}

/** Single-resource body: `data`, `bankAccount`, or root object. */
function unwrapBankAccountRecord(raw: unknown): unknown {
  const o = asRecord(raw);
  if (!o) return null;
  const data = o.data;
  if (data && typeof data === "object" && !Array.isArray(data)) return data;
  const ba = o.bankAccount;
  if (ba && typeof ba === "object" && !Array.isArray(ba)) return ba;
  return raw;
}

/**
 * GET `v1/referral/bank-accounts` list payload.
 * Supports a bare JSON array of account objects, or wrapped shapes (`data`, `bankAccounts`, …).
 */
function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const o = asRecord(raw);
  if (!o) return [];
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.bankAccounts)) return o.bankAccounts;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.results)) return o.results;
  const data = asRecord(o.data);
  if (data) {
    if (Array.isArray(data.bankAccounts)) return data.bankAccounts;
    if (Array.isArray(data.items)) return data.items;
  }
  return [];
}

function pickStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function normalizeItem(raw: unknown): GqlAffiliateBankAccount | null {
  const o = asRecord(raw);
  if (!o) return null;
  const uuid = String(o.uuid ?? o.id ?? "").trim();
  if (!uuid) return null;
  const isDef = o.isDefault ?? o.is_default;
  return {
    uuid,
    bankName: pickStr(o.bankName ?? o.bank_name),
    accountHolderName: pickStr(o.accountHolderName ?? o.account_holder_name),
    accountNumber: pickStr(o.accountNumber ?? o.account_number),
    iban: pickStr(o.iban),
    swiftCode: pickStr(o.swiftCode ?? o.swift_code ?? o.bic ?? o.bicCode),
    isDefault:
      isDef === true ||
      isDef === "true" ||
      isDef === 1 ||
      String(isDef).toLowerCase() === "1",
  };
}

/**
 * POST create and GET `.../bank-accounts/{uuid}` JSON: root `uuid` + bank fields; may include
 * nested `affiliate` (wallet stats, `type`) and `affiliate.customer` (`role`, profile). Only
 * root bank fields are mapped to `GqlAffiliateBankAccount`; use
 * `extractPartnerRoleFromBankAccountDetailBody` for display context.
 */
export function parseReferralBankAccountResponse(
  raw: unknown,
): GqlAffiliateBankAccount | null {
  const candidate = unwrapBankAccountRecord(raw);
  return normalizeItem(candidate ?? raw);
}

/** Prefer `affiliate.customer.role`, then `affiliate.type`. */
export function extractPartnerRoleFromBankAccountDetailBody(
  raw: unknown,
): string | null {
  const rootObj = asRecord(unwrapBankAccountRecord(raw) ?? raw);
  if (!rootObj) return null;
  const aff = asRecord(rootObj.affiliate);
  if (!aff) return null;
  const cust = asRecord(aff.customer);
  const role = cust ? pickStr(cust.role) : null;
  if (role) return role;
  return pickStr(aff.type);
}

/**
 * GET `v1/referral/bank-accounts` (Bearer token).
 * Typical body: `[{ uuid, bankName, accountHolderName, accountNumber, iban, swiftCode, isDefault }, …]`.
 */
export async function fetchReferralBankAccountsList(
  authToken: string,
): Promise<GqlAffiliateBankAccount[]> {
  const res = await apiFetch(API_ENDPOINTS.REFERRAL_BANK_ACCOUNTS, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  const arr = extractArray(body);
  const out: GqlAffiliateBankAccount[] = [];
  for (const item of arr) {
    const row = normalizeItem(item);
    if (row) out.push(row);
  }
  return out;
}

export type ReferralBankAccountDetailResult =
  | {
      ok: true;
      account: GqlAffiliateBankAccount;
      /** From nested payload, e.g. `affiliate.customer.role`. */
      partnerRole?: string;
    }
  | { ok: false; message: string };

/**
 * GET `v1/referral/bank-accounts/{uuid}` (Bearer token).
 * Body is commonly a single object with bank fields plus optional `affiliate` / `affiliate.customer`.
 */
export async function fetchReferralBankAccountById(
  authToken: string,
  uuid: string,
): Promise<ReferralBankAccountDetailResult> {
  const id = String(uuid ?? "").trim().replace(/^\/+/, "");
  if (!id) {
    return { ok: false, message: "Missing bank account id." };
  }

  const res = await apiFetch(API_ENDPOINTS.REFERRAL_BANK_ACCOUNT_BY_ID(id), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
    },
  });

  const body = (await res.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!res.ok) {
    return {
      ok: false,
      message:
        firstApiErrorMessage(body) ||
        `Could not load bank account (${res.status}).`,
    };
  }

  const account = parseReferralBankAccountResponse(body);
  if (!account) {
    return { ok: false, message: "Invalid response from server." };
  }
  const partnerRole = extractPartnerRoleFromBankAccountDetailBody(body);
  return {
    ok: true,
    account,
    ...(partnerRole ? { partnerRole } : {}),
  };
}

export type ReferralBankAccountUpdatePayload = {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
};

/**
 * PUT `v1/referral/bank-accounts/{uuid}` (Bearer token).
 * Response shape matches GET-by-id / POST create.
 */
export async function updateReferralBankAccount(
  authToken: string,
  uuid: string,
  payload: ReferralBankAccountUpdatePayload,
): Promise<ReferralBankAccountDetailResult> {
  const id = String(uuid ?? "").trim().replace(/^\/+/, "");
  if (!id) {
    return { ok: false, message: "Missing bank account id." };
  }

  const res = await apiFetch(API_ENDPOINTS.REFERRAL_BANK_ACCOUNT_BY_ID(id), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!res.ok) {
    return {
      ok: false,
      message:
        firstApiErrorMessage(body) ||
        `Could not update bank account (${res.status}).`,
    };
  }

  const account = parseReferralBankAccountResponse(body);
  if (!account) {
    return { ok: false, message: "Invalid response from server." };
  }
  const partnerRole = extractPartnerRoleFromBankAccountDetailBody(body);
  return {
    ok: true,
    account,
    ...(partnerRole ? { partnerRole } : {}),
  };
}

/**
 * PATCH `v1/referral/bank-accounts/{uuid}` (Bearer token), e.g. `{ isDefault: true }`.
 * Response shape matches GET-by-id / PUT.
 */
export async function patchReferralBankAccountDefault(
  authToken: string,
  uuid: string,
  isDefault: boolean = true,
): Promise<ReferralBankAccountDetailResult> {
  const id = String(uuid ?? "").trim().replace(/^\/+/, "");
  if (!id) {
    return { ok: false, message: "Missing bank account id." };
  }

  const res = await apiFetch(API_ENDPOINTS.REFERRAL_BANK_ACCOUNT_BY_ID(id), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ isDefault }),
  });

  const body = (await res.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!res.ok) {
    return {
      ok: false,
      message:
        firstApiErrorMessage(body) ||
        `Could not update default (${res.status}).`,
    };
  }

  const account = parseReferralBankAccountResponse(body);
  if (!account) {
    return { ok: false, message: "Invalid response from server." };
  }
  const partnerRole = extractPartnerRoleFromBankAccountDetailBody(body);
  return {
    ok: true,
    account,
    ...(partnerRole ? { partnerRole } : {}),
  };
}
