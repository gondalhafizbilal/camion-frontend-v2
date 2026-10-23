/** GraphQL `errors[]` entry (message + optional extensions). */
export type GraphQLErrorLike = {
  message?: string;
  extensions?: Record<string, unknown>;
};

/** Turn one API validation entry into a single user-facing string. */
function errorValueToString(value: unknown): string | null {
  if (typeof value === "string") {
    const s = value.trim();
    return s || null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const s = errorValueToString(item);
      if (s) return s;
    }
  }
  return null;
}

/**
 * First human-readable message from typical Camion auth payloads:
 * `{ message }`, `{ error }`, or `{ errors: { field: "…" } }`.
 */
export function extractApiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;

  const top = root.message ?? root.error;
  if (typeof top === "string" && top.trim()) return top.trim();
  if (top && typeof top === "object") {
    const nested = (top as Record<string, unknown>).message;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }

  const errors = root.errors;
  if (errors && typeof errors === "object") {
    for (const value of Object.values(errors as Record<string, unknown>)) {
      const msg = errorValueToString(value);
      if (msg) return msg;
    }
  }

  return null;
}

/** All human-readable messages from a GraphQL `errors` array (deduped, space-joined). */
export function extractGraphqlErrorMessage(
  errors: GraphQLErrorLike[] | undefined,
): string | null {
  if (!errors?.length) return null;
  const parts: string[] = [];
  for (const e of errors) {
    if (typeof e.message === "string" && e.message.trim()) {
      parts.push(e.message.trim());
    }
    if (e.extensions) {
      const extMsg = extractApiErrorMessage(e.extensions);
      if (extMsg) parts.push(extMsg);
    }
  }
  if (!parts.length) return null;
  return [...new Set(parts)].join(" ");
}

/**
 * REST (`message` / `errors` map) or GraphQL (`errors[]`) bodies from failed API calls.
 */
export function extractResponseErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;

  if (Array.isArray(root.errors)) {
    const gqlMsg = extractGraphqlErrorMessage(root.errors as GraphQLErrorLike[]);
    if (gqlMsg) return gqlMsg;
  }

  return extractApiErrorMessage(data);
}

export type SignupApiFieldErrors = Partial<{
  fullName: string;
  emailOrPhone: string;
  phoneLocal: string;
  general: string;
}>;

function normalizeFieldKey(key: string): string {
  return key.replace(/[_-]/g, "").toLowerCase();
}

/** Maps `v1/auth/customer/register` field errors onto signup form keys. */
export function mapRegisterApiErrors(data: unknown): SignupApiFieldErrors {
  const out: SignupApiFieldErrors = {};
  if (!data || typeof data !== "object") return out;

  const errors = (data as Record<string, unknown>).errors;
  if (!errors || typeof errors !== "object") return out;

  for (const [rawKey, value] of Object.entries(errors as Record<string, unknown>)) {
    const msg = errorValueToString(value);
    if (!msg) continue;

    const key = normalizeFieldKey(rawKey);
    if (
      key === "phonenumber" ||
      key === "phone" ||
      key === "mobilenumber" ||
      key.includes("phone")
    ) {
      out.phoneLocal = msg;
    } else if (
      key === "emailaddress" ||
      key === "email" ||
      key === "emailorphone" ||
      key.includes("email")
    ) {
      out.emailOrPhone = msg;
    } else if (key === "fullname" || key === "name" || key.includes("fullname")) {
      out.fullName = msg;
    } else {
      out.general = out.general ? `${out.general} ${msg}` : msg;
    }
  }

  return out;
}
