"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import { apiAuthPath } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import AccountPanelSurface from "./AccountPanelSurface";

type DeleteFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reasonForDeletion: string;
};

export default function AccountDeletePanel() {
  const t = useTranslations();

  const initial = useMemo(() => {
    const fullName = (Cookies.get("fullName") || "").trim();
    const parts = fullName ? fullName.split(/\s+/) : [];
    const firstName = parts[0] || "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    return {
      firstName,
      lastName,
      email: Cookies.get("email") || "",
      phone: Cookies.get("phone") || "",
      reasonForDeletion: "",
    };
  }, []);

  const [form, setForm] = useState<DeleteFormState>(initial);

  const setField =
    (key: keyof DeleteFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));

  const validate = () => {
    const missing = [];
    if (!form.firstName.trim()) missing.push("First name");
    if (!form.lastName.trim()) missing.push("Last name");
    if (!form.email.trim()) missing.push("Email");
    if (!form.phone.trim()) missing.push("Phone");
    if (!form.reasonForDeletion.trim()) missing.push("Reason for deletion");
    return missing;
  };

  const handleDelete = async () => {
    const missing = validate();
    if (missing.length) {
      toast.error(`${t("pleaseFillAllRequiredFields") || "Please fill all required fields."} (${missing.join(", ")})`);
      return;
    }

    const token = Cookies.get("token");

    if (!token) {
      toast.error(t("accountDeleteError"));
      return;
    }

    const result = await Swal.fire({
      title: t("deleteAccountConfirmationTitle"),
      text: t("deleteAccountConfirmationMessage"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#B92123",
      cancelButtonColor: "#6c757d",
      confirmButtonText: t("confirmDelete"),
      cancelButtonText: t("cancel"),
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const deleteUrl = apiAuthPath("v1/customers/me");
      const res = await apiFetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data?.message || t("accountDeleteError"));
      }

      Cookies.remove("token");
      Cookies.remove("id");
      Cookies.remove("email");
      Cookies.remove("fullName");
      Cookies.remove("phone");
      Cookies.remove("auth_method");

      toast.success(data?.message || t("accountDeletedSuccessfully"));
      setTimeout(() => {
        if (typeof window !== "undefined") window.location.href = "/auth/login";
      }, 800);
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : t("accountDeleteError"),
      );
    }
  };

  return (
    <div className="flex-1 w-full flex justify-center lg:justify-start">
      <AccountPanelSurface className="items-center min-h-0 lg:min-h-[600px]">
        <div className="rounded-full flex items-center justify-center" style={{ width: 50, height: 50, background: "#CB262E", marginTop: 18 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 5.98001C17.67 5.65001 14.32 5.48001 10.98 5.48001C9 5.48001 7.02 5.58001 5.04 5.78001L3 5.98001" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.8504 9.14001L18.2004 19.21C18.0904 20.78 18.0004 22 15.2104 22H8.79039C6.00039 22 5.91039 20.78 5.80039 19.21L5.15039 9.14001" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.3301 16.5H13.6601" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.5 12.5H14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="flex flex-col items-center text-center w-full max-w-[279px] gap-2 mt-3">
          <div
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: "24px",
              color: "#000000",
            }}
          >
            {t("deleteMyAccountTitle") || "Delete My Account"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 12,
              lineHeight: "18px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("deleteMyAccountDescription") || "This action will permanently delete your account."}
          </div>
        </div>

        <div className="w-full mt-6 flex flex-col items-center" style={{ gap: 16 }}>
          <div className="w-full" style={{ maxWidth: 665 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  style={{
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "18px",
                    color: "#000000",
                  }}
                >
                  {t("firstName") || "First name"}
                </label>
                <input
                  value={form.firstName}
                  onChange={setField("firstName")}
                  className="w-full outline-none"
                  style={{
                    boxSizing: "border-box",
                    height: 50,
                    padding: "12px 16px",
                    background: "#F6F6F6",
                    border: "1px solid #F6F6F6",
                    borderRadius: 12,
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    lineHeight: "24px",
                    color: "#000000",
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  style={{
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "18px",
                    color: "#000000",
                  }}
                >
                  {t("lastName") || "Last name"}
                </label>
                <input
                  value={form.lastName}
                  onChange={setField("lastName")}
                  className="w-full outline-none"
                  style={{
                    boxSizing: "border-box",
                    height: 50,
                    padding: "12px 16px",
                    background: "#F6F6F6",
                    border: "1px solid #F6F6F6",
                    borderRadius: 12,
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    lineHeight: "24px",
                    color: "#000000",
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  style={{
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "18px",
                    color: "#000000",
                  }}
                >
                  {t("email") || "Email"}
                </label>
                <input
                  value={form.email}
                  onChange={setField("email")}
                  inputMode="email"
                  className="w-full outline-none"
                  style={{
                    boxSizing: "border-box",
                    height: 50,
                    padding: "12px 16px",
                    background: "#F6F6F6",
                    border: "1px solid #F6F6F6",
                    borderRadius: 12,
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    lineHeight: "24px",
                    color: "#000000",
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  style={{
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: "18px",
                    color: "#000000",
                  }}
                >
                  {t("phone") || "Phone"}
                </label>
                <input
                  value={form.phone}
                  onChange={setField("phone")}
                  inputMode="tel"
                  className="w-full outline-none"
                  style={{
                    boxSizing: "border-box",
                    height: 50,
                    padding: "12px 16px",
                    background: "#F6F6F6",
                    border: "1px solid #F6F6F6",
                    borderRadius: 12,
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    lineHeight: "24px",
                    color: "#000000",
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <label
                style={{
                  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  lineHeight: "18px",
                  color: "#000000",
                }}
              >
                {t("reasonForDeletion") || "Reason for deletion"}
              </label>
              <textarea
                value={form.reasonForDeletion}
                onChange={setField("reasonForDeletion")}
                className="w-full resize-none outline-none placeholder:text-[#908C91]"
                placeholder={t("reasonForDeletionPlaceholder") || "Please let us know why you want to delete your account…"}
                style={{
                  boxSizing: "border-box",
                  height: 168,
                  padding: "12px 16px",
                  background: "#F6F6F6",
                  border: "1px solid #F6F6F6",
                  borderRadius: 12,
                  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: "24px",
                  color: "#000000",
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          className="mt-8 w-full max-w-[662px] h-12 sm:h-[50px] flex items-center justify-center hover:opacity-90 transition-opacity bg-[#CB262E] rounded-[5px] px-6 font-sans font-semibold text-base leading-6 capitalize text-white"
        >
          {t("delete") || "Delete"}
        </button>
      </AccountPanelSurface>
    </div>
  );
}

