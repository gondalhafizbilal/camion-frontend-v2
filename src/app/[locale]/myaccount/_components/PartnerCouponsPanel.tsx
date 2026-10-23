"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/services/api/apiClient";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { PartnerCouponListRow } from "../_types/partnerCoupon";
import { formatCouponListMoney } from "../_lib/gqlAffiliateCouponToPartnerRow";
import AccountPanelSurface from "./AccountPanelSurface";

function isCouponExpired(coupon: PartnerCouponListRow) {
  if (!coupon?.expiryDate) return false;
  const exp = new Date(coupon.expiryDate);
  if (Number.isNaN(exp.getTime())) return false;
  return exp.getTime() < Date.now();
}

function getCouponStatus(coupon: PartnerCouponListRow) {
  if (isCouponExpired(coupon)) return "expired";
  const statusText = String(coupon?.status || "").toLowerCase();
  if (statusText.includes("expired") || statusText.includes("inactive"))
    return "expired";
  if (coupon?.isActive === false || coupon?.active === false) return "expired";
  return "active";
}

function getOrdersCount(coupon: PartnerCouponListRow) {
  const n = Number(coupon.ordersCount ?? coupon.usage ?? 0);
  return Number.isNaN(n) ? 0 : n;
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-3 px-2 sm:px-3 border border-black/15 rounded-[5px] bg-white min-h-[82px] w-full"
    >
      <div className="relative w-8 h-8 shrink-0">
        <div
          className="absolute inset-0 rounded-full bg-[#CB262E]"
          aria-hidden
        />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans font-bold text-base leading-6 text-white text-center"
        >
          {value}
        </span>
      </div>
      <span className="font-sans font-semibold text-[10px] sm:text-[10px] leading-[18px] capitalize text-black text-center">
        {label}
      </span>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center justify-center px-3 sm:px-4 h-[30px] rounded-[5px] font-sans font-medium text-xs leading-6 capitalize transition-colors ${
        active
          ? "bg-[#CB262E] text-white border-none"
          : "bg-white text-black border border-black/15"
      }`}
    >
      {label}
    </button>
  );
}

function InfoPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 min-h-[24px] rounded-[5px] bg-[#E3FFD5] font-sans font-medium text-xs leading-[15px] text-[#3D743A] whitespace-nowrap max-w-full truncate">
      {text}
    </span>
  );
}

function CouponCard({
  coupon,
  statisticsHref,
}: {
  coupon: PartnerCouponListRow;
  statisticsHref: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const status = getCouponStatus(coupon);
  const active = status === "active";

  function formatCreatedAt(value: unknown): string {
    const prefix = t("orderPlacedAtLabel");
    if (value == null || value === "") return `${prefix} —`;
    const date = new Date(
      typeof value === "string" || typeof value === "number"
        ? value
        : String(value),
    );
    if (Number.isNaN(date.getTime())) return `${prefix} ${String(value)}`;
    const loc = locale === "ar" ? "ar" : "en-US";
    return `${prefix} ${date.toLocaleString(loc, {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  function discountText(): string {
    const raw =
      coupon?.discountPercentage ?? coupon?.discount ?? coupon?.amount ?? 0;
    const value = Number(raw);
    return Number.isNaN(value)
      ? t("partnerCouponDiscountRaw", { value: String(raw) })
      : t("partnerCouponDiscountPct", { percent: value });
  }

  function commissionText(): string | null {
    const raw = coupon?.commissionPercentage ?? coupon?.commission;
    if (raw === undefined || raw === null) return null;
    const value = Number(raw);
    return Number.isNaN(value)
      ? t("partnerCouponCommissionRaw", { value: String(raw) })
      : t("partnerCouponCommissionPct", { percent: value });
  }

  const commissionLabel = commissionText();

  const salesLabel =
    coupon.totalSalesAmount != null && coupon.totalSalesAmount > 0
      ? t("partnerCouponTotalSales", {
          amount: formatCouponListMoney(
            coupon.totalSalesAmount,
            coupon.totalSalesCurrency || "QAR",
            locale,
          ),
        })
      : null;

  const earnedLabel =
    coupon.totalCommissionAmount != null && coupon.totalCommissionAmount > 0
      ? t("partnerCouponTotalCommission", {
          amount: formatCouponListMoney(
            coupon.totalCommissionAmount,
            coupon.totalCommissionCurrency || "QAR",
            locale,
          ),
        })
      : null;

  return (
    <div className="w-full box-border bg-white border border-[#D9D9D9] rounded-[5px] p-3 sm:p-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
      {/*
        Keep stacked layout through `lg` (1024px): a row + max-w-[240px] on the token column
        hid coupon code and long Date/Time strings on laptop widths. Horizontal layout starts at `xl`.
      */}
      <div className="flex flex-col gap-2 min-w-0 w-full xl:flex-1 xl:min-w-0 xl:max-w-none xl:basis-0">
        <span
          className="font-sans font-medium text-base leading-6 capitalize text-black break-words [overflow-wrap:anywhere]"
          title={coupon?.code ? String(coupon.code) : undefined}
        >
          {coupon?.code || "—"}
        </span>
        <span className="font-sans font-semibold text-xs leading-[18px] capitalize text-black break-words whitespace-normal">
          {formatCreatedAt(coupon?.createdAt)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 items-center min-w-0 w-full xl:w-auto xl:max-w-[min(100%,22rem)] xl:justify-end">
        <InfoPill
          text={active ? t("partnerCouponPillActive") : t("partnerCouponPillExpired")}
        />
        <InfoPill text={discountText()} />
        {commissionLabel ? <InfoPill text={commissionLabel} /> : null}
        <InfoPill
          text={t("partnerCouponOrdersCount", { count: getOrdersCount(coupon) })}
        />
        {salesLabel ? <InfoPill text={salesLabel} /> : null}
        {earnedLabel ? <InfoPill text={earnedLabel} /> : null}
      </div>

      <Link
        href={`${statisticsHref}?couponId=${encodeURIComponent(
          String(coupon?.id || coupon?._id || coupon?.code || ""),
        )}&couponCode=${encodeURIComponent(String(coupon?.code || ""))}`}
        className="w-full xl:w-[210px] xl:shrink-0 h-10 flex items-center justify-center px-4 bg-[#CB262E] rounded-[5px] no-underline hover:opacity-90 transition-opacity"
      >
        <span className="font-sans font-semibold text-xs sm:text-sm leading-6 capitalize text-white text-center truncate max-w-full">
          {t("partnerCouponViewStatistics")}
        </span>
      </Link>
    </div>
  );
}

function defaultNormalize(raw: unknown): PartnerCouponListRow[] {
  if (Array.isArray(raw)) return raw as PartnerCouponListRow[];
  return [];
}

export default function PartnerCouponsPanel({
  title,
  fetchEndpoint,
  loadCoupons,
  statisticsHref = "/coupons",
  normalize = defaultNormalize,
}: {
  /** When omitted, uses `partnerCouponsTitle` from messages. */
  title?: string;
  fetchEndpoint?: string;
  /** When set, loads coupons via GraphQL/custom loader instead of `fetchEndpoint`. */
  loadCoupons?: () => Promise<PartnerCouponListRow[]>;
  statisticsHref?: string;
  normalize?: (raw: unknown) => PartnerCouponListRow[];
}) {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PartnerCouponListRow[]>([]);
  const [filter, setFilter] = useState("all");

  const displayTitle =
    typeof title === "string" && title.trim() !== "" ? title : t("partnerCouponsTitle");

  useEffect(() => {
    const run = async () => {
      const token = Cookies.get("token");
      if (loadCoupons) {
        if (!token) {
          setLoading(false);
          setItems([]);
          return;
        }
        try {
          const normalized = await loadCoupons();
          setItems(Array.isArray(normalized) ? normalized : []);
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
        return;
      }
      if (!token || !fetchEndpoint) {
        setLoading(false);
        setItems([]);
        return;
      }
      try {
        const res = await apiFetch(fetchEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json().catch(() => ({}));
        const normalized = normalize(data);
        setItems(Array.isArray(normalized) ? normalized : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [fetchEndpoint, normalize, loadCoupons]);

  const normalizedItems = Array.isArray(items) ? items : [];
  const activeItems = normalizedItems.filter(
    (item) => getCouponStatus(item) === "active",
  );
  const expiredItems = normalizedItems.filter(
    (item) => getCouponStatus(item) === "expired",
  );
  const filteredItems =
    filter === "active"
      ? activeItems
      : filter === "expired"
        ? expiredItems
        : normalizedItems;

  return (
    <AccountPanelSurface className="min-h-0 lg:min-h-[520px]">
      <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444] m-0">
        {displayTitle}
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-[710px] mt-5 sm:mt-6">
        <StatCard value={activeItems.length} label={t("partnerCouponsStatActive")} />
        <StatCard value={expiredItems.length} label={t("partnerCouponsStatExpired")} />
      </div>

      <div
        className="flex flex-row flex-nowrap gap-3 sm:gap-4 mt-5 sm:mt-6 overflow-x-auto pb-1 scrollbar-hide w-full max-w-[710px]"
      >
        <FilterButton
          label={t("partnerCouponsFilterAll")}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterButton
          label={t("partnerCouponsFilterActive")}
          active={filter === "active"}
          onClick={() => setFilter("active")}
        />
        <FilterButton
          label={t("partnerCouponsFilterExpired")}
          active={filter === "expired"}
          onClick={() => setFilter("expired")}
        />
      </div>

      <div className="mt-5 sm:mt-6 flex flex-col gap-3 sm:gap-4 w-full max-w-[710px] max-h-[min(55vh,450px)] sm:max-h-[450px] overflow-y-auto overflow-x-hidden pr-1 -mr-1">
        {loading ? (
          <div
            className="w-full min-h-[128px] rounded-[5px] bg-[#F3F3F3] border border-[#E5E5E5] animate-pulse"
            aria-hidden
          />
        ) : filteredItems.length === 0 ? (
          <div className="w-full min-h-[100px] rounded-[5px] border border-[#D9D9D9] flex items-center justify-center px-4 font-sans font-medium text-sm leading-5 text-black/60 text-center">
            {t("partnerCouponsEmpty")}
          </div>
        ) : (
          filteredItems.map((coupon, index) => (
            <CouponCard
              key={coupon?.id || coupon?._id || coupon?.code || index}
              coupon={coupon}
              statisticsHref={statisticsHref}
            />
          ))
        )}
      </div>
    </AccountPanelSurface>
  );
}
