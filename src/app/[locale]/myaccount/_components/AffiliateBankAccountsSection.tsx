"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import type { GqlAffiliateBankAccount } from "@/services/graphql";
import {
  fetchReferralBankAccountById,
  fetchReferralBankAccountsList,
  parseReferralBankAccountResponse,
  patchReferralBankAccountDefault,
  updateReferralBankAccount,
} from "@/app/[locale]/myaccount/_lib/fetchReferralBankAccountsList";
import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import AccountPanelSurface from "./AccountPanelSurface";

const PAGE_SIZE = 20;

const labelClass =
  "font-sans font-medium text-xs sm:text-sm leading-5 text-black/90";
const inputClass =
  "w-full min-w-0 box-border min-h-[44px] rounded-[8px] border border-black/15 px-3 sm:px-4 font-sans text-sm text-black outline-none focus:border-[#CB262E]/55 focus:ring-1 focus:ring-[#CB262E]/25";

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

function dash(value: string | null | undefined) {
  const s = String(value ?? "").trim();
  return s || "—";
}

function formatPartnerRole(
  role: string | null | undefined,
  t: (key: string) => string,
): string {
  const r = String(role ?? "").trim().toLowerCase();
  if (r === "affiliate") return t("partnerRoleAffiliate");
  if (r === "influencer") return t("partnerRoleInfluencer");
  return String(role ?? "").trim();
}

function BankAccountCard({
  row,
  onViewDetails,
  onSetDefault,
  settingDefaultUuid,
}: {
  row: GqlAffiliateBankAccount;
  onViewDetails?: (uuid: string) => void;
  onSetDefault?: (uuid: string) => void;
  settingDefaultUuid?: string | null;
}) {
  const t = useTranslations();
  const isDefault = Boolean(row.isDefault);
  const defaultBusy = settingDefaultUuid === row.uuid;
  return (
    <div
      className={`rounded-[10px] border border-black/15 p-4 ${
        isDefault ? "border-l-4 border-l-[#CB262E] bg-[#CB262E]/[0.04]" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-sans font-semibold text-sm text-black">{dash(row.bankName)}</h3>
        {isDefault ? (
          <span className="shrink-0 rounded-full bg-[#CB262E] px-2.5 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-white">
            {t("partnerBankDefault")}
          </span>
        ) : null}
      </div>
      <dl className="mt-3 space-y-2 font-sans text-xs text-black/90">
        <div>
          <dt className="text-black/55">{t("partnerBankLabelAccountHolder")}</dt>
          <dd className="mt-0.5">{dash(row.accountHolderName)}</dd>
        </div>
        <div>
          <dt className="text-black/55">{t("partnerBankLabelAccountNumber")}</dt>
          <dd className="mt-0.5 font-mono text-[13px] break-all">{dash(row.accountNumber)}</dd>
        </div>
        <div>
          <dt className="text-black/55">{t("partnerBankFieldIban")}</dt>
          <dd className="mt-0.5 font-mono text-[13px] break-all">{dash(row.iban)}</dd>
        </div>
        <div>
          <dt className="text-black/55">{t("partnerBankFieldSwift")}</dt>
          <dd className="mt-0.5 font-mono text-[13px]">{dash(row.swiftCode)}</dd>
        </div>
      </dl>
      {!isDefault && onSetDefault ? (
        <button
          type="button"
          disabled={Boolean(settingDefaultUuid)}
          onClick={() => onSetDefault(row.uuid)}
          className="mt-4 min-h-[40px] w-full rounded-[8px] bg-[#CB262E] px-3 font-sans text-sm font-semibold text-white hover:opacity-92 disabled:opacity-45 disabled:pointer-events-none"
        >
          {defaultBusy ? t("partnerBankUpdating") : t("partnerBankSetAsDefault")}
        </button>
      ) : null}
      {onViewDetails ? (
        <button
          type="button"
          onClick={() => onViewDetails(row.uuid)}
          className={`min-h-[40px] w-full rounded-[8px] border border-[#CB262E]/40 bg-white px-3 font-sans text-sm font-semibold text-[#CB262E] hover:bg-[#CB262E]/[0.06] ${!isDefault && onSetDefault ? "mt-2" : "mt-4"}`}
        >
          {t("partnerBankViewFullDetails")}
        </button>
      ) : null}
    </div>
  );
}

export default function AffiliateBankAccountsSection() {
  const t = useTranslations();
  const [pageNumber, setPageNumber] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [accounts, setAccounts] = useState<GqlAffiliateBankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formIsError, setFormIsError] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailAccount, setDetailAccount] = useState<GqlAffiliateBankAccount | null>(
    null,
  );
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailPartnerRole, setDetailPartnerRole] = useState<string | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [editBankName, setEditBankName] = useState("");
  const [editAccountHolderName, setEditAccountHolderName] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editIban, setEditIban] = useState("");
  const [editSwiftCode, setEditSwiftCode] = useState("");
  const [detailSaveSubmitting, setDetailSaveSubmitting] = useState(false);
  const [detailSaveMessage, setDetailSaveMessage] = useState("");
  const [detailSaveIsError, setDetailSaveIsError] = useState(false);
  const [settingDefaultUuid, setSettingDefaultUuid] = useState<string | null>(
    null,
  );
  const [setDefaultError, setSetDefaultError] = useState("");

  const applyPatchedAccount = useCallback(
    (result: { account: GqlAffiliateBankAccount; partnerRole?: string }) => {
      const updated = result.account;
      setAccounts((prev) => {
        if (updated.isDefault === true) {
          return prev.map((a) =>
            a.uuid === updated.uuid ? updated : { ...a, isDefault: false },
          );
        }
        return prev.map((a) => (a.uuid === updated.uuid ? updated : a));
      });
      setDetailAccount((d) => (d?.uuid === updated.uuid ? updated : d));
      setDetailPartnerRole((prev) => result.partnerRole ?? prev);
    },
    [],
  );

  const handleSetDefaultAccount = useCallback(
    async (uuid: string) => {
      const token = Cookies.get("token");
      if (!token) return;
      setSetDefaultError("");
      setSettingDefaultUuid(uuid);
      try {
        const result = await patchReferralBankAccountDefault(token, uuid, true);
        if (!result.ok) {
          setSetDefaultError(result.message);
          return;
        }
        applyPatchedAccount(result);
      } catch {
        setSetDefaultError(t("partnerBankSetDefaultFailed"));
      } finally {
        setSettingDefaultUuid(null);
      }
    },
    [applyPatchedAccount, t],
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailAccount(null);
    setDetailError(null);
    setDetailLoading(false);
    setDetailPartnerRole(null);
    setDetailEditing(false);
    setEditBankName("");
    setEditAccountHolderName("");
    setEditAccountNumber("");
    setEditIban("");
    setEditSwiftCode("");
    setDetailSaveSubmitting(false);
    setDetailSaveMessage("");
    setDetailSaveIsError(false);
    setSetDefaultError("");
  }, []);

  const startDetailEdit = useCallback(() => {
    if (!detailAccount) return;
    setEditBankName(String(detailAccount.bankName ?? ""));
    setEditAccountHolderName(String(detailAccount.accountHolderName ?? ""));
    setEditAccountNumber(String(detailAccount.accountNumber ?? ""));
    setEditIban(String(detailAccount.iban ?? ""));
    setEditSwiftCode(String(detailAccount.swiftCode ?? ""));
    setDetailSaveMessage("");
    setDetailSaveIsError(false);
    setDetailEditing(true);
  }, [detailAccount]);

  const cancelDetailEdit = useCallback(() => {
    setDetailEditing(false);
    setDetailSaveMessage("");
    setDetailSaveIsError(false);
  }, []);

  const onSaveDetailEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token || !detailAccount) return;

    const bn = editBankName.trim();
    const holder = editAccountHolderName.trim();
    const acc = editAccountNumber.trim();
    const ib = editIban.trim();
    const swift = editSwiftCode.trim();

    if (!bn || !holder || !acc || !ib || !swift) {
      setDetailSaveIsError(true);
      setDetailSaveMessage(t("partnerBankFillAllFields"));
      return;
    }

    setDetailSaveSubmitting(true);
    setDetailSaveMessage("");
    setDetailSaveIsError(false);

    try {
      const result = await updateReferralBankAccount(token, detailAccount.uuid, {
        bankName: bn,
        accountHolderName: holder,
        accountNumber: acc,
        iban: ib,
        swiftCode: swift,
      });

      if (!result.ok) {
        setDetailSaveIsError(true);
        setDetailSaveMessage(result.message);
        return;
      }

      applyPatchedAccount(result);
      setDetailEditing(false);
      setDetailSaveMessage("");
      setDetailSaveIsError(false);
    } catch {
      setDetailSaveIsError(true);
      setDetailSaveMessage(t("partnerBankUpdateFailed"));
    } finally {
      setDetailSaveSubmitting(false);
    }
  };

  const openBankDetail = useCallback(async (uuid: string) => {
    const token = Cookies.get("token");
    if (!token) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailAccount(null);
    setDetailPartnerRole(null);
    setDetailEditing(false);
    setDetailSaveMessage("");
    setDetailSaveIsError(false);
    setSetDefaultError("");
    const result = await fetchReferralBankAccountById(token, uuid);
    if (result.ok) {
      setDetailAccount(result.account);
      setDetailPartnerRole(result.partnerRole ?? null);
      setDetailError(null);
    } else {
      setDetailAccount(null);
      setDetailPartnerRole(null);
      setDetailError(result.message);
    }
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (!detailOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailOpen, closeDetail]);

  const bumpSessionReload = useCallback(() => {
    setPageNumber(1);
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const token = Cookies.get("token");
      if (!token) {
        if (!cancelled) {
          setAccounts([]);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const list = await fetchReferralBankAccountsList(token);
        if (!cancelled) {
          setAccounts(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(accounts.length / PAGE_SIZE));
    setPageNumber((p) => Math.min(Math.max(1, p), totalPages));
  }, [accounts.length]);

  const rows = useMemo(() => {
    const start = (pageNumber - 1) * PAGE_SIZE;
    return accounts.slice(start, start + PAGE_SIZE);
  }, [accounts, pageNumber]);

  useEffect(() => {
    const onSession = () => bumpSessionReload();
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
  }, [bumpSessionReload]);

  const hasPrevPage = pageNumber > 1;
  const hasNextPage = !loading && pageNumber * PAGE_SIZE < accounts.length;

  const onAddBankAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      setFormIsError(true);
      setFormMessage(t("partnerBankSignInToAdd"));
      return;
    }

    const bn = bankName.trim();
    const holder = accountHolderName.trim();
    const acc = accountNumber.trim();
    const ib = iban.trim();
    const swift = swiftCode.trim();

    if (!bn || !holder || !acc || !ib || !swift) {
      setFormIsError(true);
      setFormMessage(t("partnerBankFillAllFields"));
      return;
    }

    setFormSubmitting(true);
    setFormMessage("");
    setFormIsError(false);

    try {
      const res = await apiFetch(API_ENDPOINTS.REFERRAL_BANK_ACCOUNTS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankName: bn,
          accountHolderName: holder,
          accountNumber: acc,
          iban: ib,
          swiftCode: swift,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!res.ok) {
        throw new Error(
          firstApiErrorMessage(data) || t("partnerBankAddFailed"),
        );
      }

      const created = parseReferralBankAccountResponse(data);

      setBankName("");
      setAccountHolderName("");
      setAccountNumber("");
      setIban("");
      setSwiftCode("");
      setFormIsError(false);
      setFormMessage(t("partnerBankAddSuccess"));

      if (created) {
        setAccounts((prev) => {
          const withoutDup = prev.filter((a) => a.uuid !== created.uuid);
          const others =
            created.isDefault === true
              ? withoutDup.map((a) => ({ ...a, isDefault: false }))
              : withoutDup;
          return [created, ...others];
        });
        setPageNumber(1);
      } else {
        bumpSessionReload();
      }
    } catch (err: unknown) {
      setFormIsError(true);
      setFormMessage(
        err instanceof Error ? err.message : t("partnerBankAddFailed"),
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <AccountPanelSurface className="min-h-0">
      {detailOpen ? (
        <div
          className="fixed inset-0 z-[240] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bank-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <div
            className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-t-[14px] bg-white p-4 shadow-xl sm:rounded-[14px] sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/10 pb-3">
              <div className="min-w-0 flex-1">
                <h3
                  id="bank-detail-title"
                  className="font-sans text-base font-semibold text-black"
                >
                  {detailEditing ? t("partnerBankEditTitle") : t("partnerBankDetailTitle")}
                </h3>
                {detailPartnerRole ? (
                  <p className="mt-1 font-sans text-xs capitalize text-black/60">
                    {t("partnerBankPartnerProgram")}{" "}
                    <span className="font-medium text-black/85">
                      {formatPartnerRole(detailPartnerRole, t)}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {detailAccount && !detailLoading && !detailError ? (
                  <button
                    type="button"
                    onClick={detailEditing ? cancelDetailEdit : startDetailEdit}
                    className="min-h-[40px] shrink-0 rounded-[8px] border border-black/20 px-3 font-sans text-sm font-semibold text-black hover:bg-black/[0.04]"
                  >
                    {detailEditing ? t("cancel") : t("edit")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closeDetail}
                  className="min-h-[40px] shrink-0 rounded-[8px] px-3 font-sans text-sm font-semibold text-[#CB262E] hover:bg-black/[0.04]"
                >
                  {t("close")}
                </button>
              </div>
            </div>
            <div className="mt-4">
              {detailLoading ? (
                <div className="space-y-2" aria-busy="true">
                  <div className="h-6 w-2/3 rounded bg-gray-100 animate-pulse" />
                  <div className="h-20 w-full rounded-lg bg-gray-100 animate-pulse" />
                </div>
              ) : detailError ? (
                <p className="font-sans text-sm text-[#CB262E]" role="alert">
                  {detailError}
                </p>
              ) : detailAccount && detailEditing ? (
                <form
                  onSubmit={onSaveDetailEdit}
                  className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2"
                >
                  <div className="flex flex-col gap-1.5 md:col-span-1">
                    <label htmlFor="detail-edit-bank-name" className={labelClass}>
                      {t("partnerBankFieldBankName")}
                    </label>
                    <input
                      id="detail-edit-bank-name"
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-1">
                    <label
                      htmlFor="detail-edit-account-holder"
                      className={labelClass}
                    >
                      {t("partnerBankFieldAccountHolder")}
                    </label>
                    <input
                      id="detail-edit-account-holder"
                      value={editAccountHolderName}
                      onChange={(e) => setEditAccountHolderName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label
                      htmlFor="detail-edit-account-number"
                      className={labelClass}
                    >
                      {t("partnerBankFieldAccountNumber")}
                    </label>
                    <input
                      id="detail-edit-account-number"
                      value={editAccountNumber}
                      onChange={(e) => setEditAccountNumber(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-1">
                    <label htmlFor="detail-edit-iban" className={labelClass}>
                      {t("partnerBankFieldIban")}
                    </label>
                    <input
                      id="detail-edit-iban"
                      value={editIban}
                      onChange={(e) => setEditIban(e.target.value)}
                      className={`${inputClass} font-mono text-[13px]`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-1">
                    <label htmlFor="detail-edit-swift" className={labelClass}>
                      {t("partnerBankFieldSwift")}
                    </label>
                    <input
                      id="detail-edit-swift"
                      value={editSwiftCode}
                      onChange={(e) => setEditSwiftCode(e.target.value)}
                      className={`${inputClass} font-mono text-[13px]`}
                    />
                  </div>
                  {detailSaveMessage ? (
                    <p
                      className={`md:col-span-2 font-sans text-sm ${
                        detailSaveIsError ? "text-[#CB262E]" : "text-emerald-700"
                      }`}
                      role="status"
                    >
                      {detailSaveMessage}
                    </p>
                  ) : null}
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={detailSaveSubmitting}
                      className="min-h-[44px] rounded-[8px] bg-[#CB262E] px-6 font-sans text-sm font-semibold text-white hover:opacity-92 disabled:opacity-45 disabled:pointer-events-none"
                    >
                      {detailSaveSubmitting ? t("saving") : t("partnerBankSaveChanges")}
                    </button>
                  </div>
                </form>
              ) : detailAccount ? (
                <>
                  <BankAccountCard row={detailAccount} />
                  {!Boolean(detailAccount.isDefault) ? (
                    <button
                      type="button"
                      disabled={Boolean(settingDefaultUuid)}
                      onClick={() =>
                        void handleSetDefaultAccount(detailAccount.uuid)
                      }
                      className="mt-4 min-h-[44px] w-full rounded-[8px] bg-[#CB262E] px-3 font-sans text-sm font-semibold text-white hover:opacity-92 disabled:opacity-45 disabled:pointer-events-none"
                    >
                      {settingDefaultUuid === detailAccount.uuid
                        ? t("partnerBankUpdating")
                        : t("partnerBankSetAsDefault")}
                    </button>
                  ) : (
                    <p className="mt-3 font-sans text-xs text-black/55">
                      {t("partnerBankDefaultPayoutNote")}
                    </p>
                  )}
                  {setDefaultError ? (
                    <p
                      className="mt-2 font-sans text-sm text-[#CB262E]"
                      role="alert"
                    >
                      {setDefaultError}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <h2 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]">
        {t("bankAccounts")}
      </h2>
      <p className="mt-2 max-w-[760px] font-sans text-xs sm:text-sm leading-[18px] text-black/80">
        {t("partnerBankIntro", { pageSize: PAGE_SIZE })}
      </p>

      <div className="mt-5 rounded-[12px] border border-[#CB262E]/20 bg-gradient-to-br from-[#CB262E]/[0.06] to-white p-4 sm:p-6 shadow-sm">
        <h3 className="font-sans font-semibold text-sm sm:text-base text-black">
          {t("partnerBankAddTitle")}
        </h3>
        <p className="mt-1 max-w-[640px] font-sans text-xs sm:text-sm text-black/65">
          {t("partnerBankAddHint")}
        </p>

        <form
          onSubmit={onAddBankAccount}
          className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2"
        >
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label htmlFor="partner-bank-name" className={labelClass}>
              {t("partnerBankFieldBankName")}
            </label>
            <input
              id="partner-bank-name"
              name="bankName"
              autoComplete="organization"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={t("partnerBankPhBankName")}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label htmlFor="partner-account-holder" className={labelClass}>
              {t("partnerBankFieldAccountHolder")}
            </label>
            <input
              id="partner-account-holder"
              name="accountHolderName"
              autoComplete="name"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder={t("partnerBankPhAccountHolder")}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="partner-account-number" className={labelClass}>
              {t("partnerBankFieldAccountNumber")}
            </label>
            <input
              id="partner-account-number"
              name="accountNumber"
              autoComplete="off"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={t("partnerBankPhAccountNumber")}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label htmlFor="partner-iban" className={labelClass}>
              {t("partnerBankFieldIban")}
            </label>
            <input
              id="partner-iban"
              name="iban"
              autoComplete="off"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder={t("partnerBankPhIban")}
              className={`${inputClass} font-mono text-[13px]`}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label htmlFor="partner-swift" className={labelClass}>
              {t("partnerBankFieldSwift")}
            </label>
            <input
              id="partner-swift"
              name="swiftCode"
              autoComplete="off"
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.target.value)}
              placeholder={t("partnerBankPhSwift")}
              className={`${inputClass} font-mono text-[13px]`}
            />
          </div>

          {formMessage ? (
            <p
              className={`md:col-span-2 font-sans text-sm ${
                formIsError ? "text-[#CB262E]" : "text-emerald-700"
              }`}
              role="status"
            >
              {formMessage}
            </p>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={formSubmitting}
              className="min-h-[44px] rounded-[8px] bg-[#CB262E] px-6 font-sans text-sm font-semibold text-white shadow-sm hover:opacity-92 disabled:opacity-45 disabled:pointer-events-none"
            >
              {formSubmitting ? t("saving") : t("partnerBankSaveAccount")}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-sans text-sm text-black/80" aria-live="polite">
          {loading ? t("loading") : `${t("page")} ${pageNumber}`}
        </span>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            disabled={!hasPrevPage || loading}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            className="min-h-[44px] px-4 rounded-[5px] font-sans font-semibold text-sm capitalize text-[#CB262E] border border-[#CB262E] hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("previous")}
          </button>
          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => setPageNumber((p) => p + 1)}
            className="min-h-[44px] px-4 rounded-[5px] font-sans font-semibold text-sm capitalize text-white bg-[#CB262E] hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("next")}
          </button>
        </div>
      </div>

      {setDefaultError && !detailOpen ? (
        <p className="mt-2 font-sans text-sm text-[#CB262E]" role="alert">
          {setDefaultError}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 w-full rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-black/70">
          {pageNumber <= 1
            ? t("partnerBankEmptyFirst")
            : t("partnerBankEmptyPage")}
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-4 md:hidden">
            {rows.map((row) => (
              <BankAccountCard
                key={row.uuid}
                row={row}
                onViewDetails={openBankDetail}
                onSetDefault={handleSetDefaultAccount}
                settingDefaultUuid={settingDefaultUuid}
              />
            ))}
          </div>

          <div className="mt-4 hidden md:block w-full overflow-x-auto rounded-[10px] border border-black/15">
            <table className="min-w-[1040px] w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-black/[0.02]">
                  <th className="px-3 py-2.5 font-sans font-semibold text-black">
                    {t("partnerBankTableBank")}
                  </th>
                  <th className="px-3 py-2.5 font-sans font-semibold text-black">
                    {t("partnerBankTableHolder")}
                  </th>
                  <th className="px-3 py-2.5 font-sans font-semibold text-black">
                    {t("partnerBankTableAccountNo")}
                  </th>
                  <th className="px-3 py-2.5 font-sans font-semibold text-black">
                    {t("partnerBankTableIban")}
                  </th>
                  <th className="px-3 py-2.5 font-sans font-semibold text-black">
                    {t("partnerBankTableSwift")}
                  </th>
                  <th className="px-3 py-2.5 font-sans font-semibold text-black">
                    {t("partnerBankTableDefault")}
                  </th>
                  <th className="px-3 py-2.5 font-sans font-semibold text-black min-w-[140px]">
                    {t("partnerBankTableActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isDefault = Boolean(row.isDefault);
                  return (
                    <tr
                      key={row.uuid}
                      className={`border-b border-black/10 last:border-b-0 ${
                        isDefault ? "bg-[#CB262E]/[0.06]" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 font-sans text-black">
                        <span className="inline-flex flex-wrap items-center gap-2">
                          {dash(row.bankName)}
                          {isDefault ? (
                            <span className="rounded-full bg-[#CB262E] px-2 py-0.5 text-[10px] font-semibold uppercase leading-none text-white">
                              {t("partnerBankDefault")}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-sans text-black">{dash(row.accountHolderName)}</td>
                      <td className="px-3 py-2.5 font-mono text-[13px] text-black whitespace-nowrap">
                        {dash(row.accountNumber)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-black break-all max-w-[220px]">
                        {dash(row.iban)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[13px] text-black whitespace-nowrap">
                        {dash(row.swiftCode)}
                      </td>
                      <td className="px-3 py-2.5 font-sans text-black">
                        {isDefault ? t("partnerBankYes") : "—"}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => void openBankDetail(row.uuid)}
                            className="min-h-[36px] rounded-[6px] border border-[#CB262E]/50 px-3 font-sans text-xs font-semibold text-[#CB262E] hover:bg-[#CB262E]/[0.06]"
                          >
                            {t("partnerBankDetails")}
                          </button>
                          {!isDefault ? (
                            <button
                              type="button"
                              disabled={Boolean(settingDefaultUuid)}
                              onClick={() =>
                                void handleSetDefaultAccount(row.uuid)
                              }
                              className="min-h-[36px] rounded-[6px] bg-[#CB262E]/10 px-2 font-sans text-[11px] font-semibold leading-tight text-[#CB262E] hover:bg-[#CB262E]/15 disabled:opacity-45 disabled:pointer-events-none"
                            >
                              {settingDefaultUuid === row.uuid
                                ? t("partnerBankUpdating")
                                : t("partnerBankSetDefaultShort")}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AccountPanelSurface>
  );
}
