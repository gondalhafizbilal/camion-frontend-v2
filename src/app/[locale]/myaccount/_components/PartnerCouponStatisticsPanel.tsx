"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Cookies from "js-cookie";
import { apiFetch } from "@/services/api/apiClient";
import { fetchCouponOrders } from "@/services/graphql";
import { translateOrderDisplayStatus } from "@/lib/order/translateOrderDisplayStatus";
import type { PartnerCouponStatsRow } from "../_types/partnerCoupon";
import { fetchReferralCouponDetail } from "../_lib/fetchReferralCouponDetail";
import {
  formatPartnerCouponOrderMoney,
  gqlCouponOrdersToPartnerRows,
  type PartnerCouponOrderRow,
} from "../_lib/gqlCouponOrdersToPartnerRows";
import AccountPanelSurface from "./AccountPanelSurface";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";

const COUPON_ORDERS_PAGE_SIZE = 24;

function formatMoneyValue(value: unknown, currency: string, locale: string) {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return formatAmountWithCurrency(0, currency, locale);
  return formatAmountWithCurrency(n, currency, locale);
}

function formatCouponDateLabel(
  value: unknown,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  locale: string,
) {
  if (value == null || value === "") return t("partnerCouponStatisticsDateTimeEmpty");
  const d = new Date(
    typeof value === "string" || typeof value === "number"
      ? value
      : String(value),
  );
  if (Number.isNaN(d.getTime())) {
    return t("partnerCouponStatisticsDateTime", { value: String(value) });
  }
  const tag = locale === "ar" ? "ar" : "en-US";
  const formatted = d.toLocaleString(tag, {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale !== "ar",
  });
  return t("partnerCouponStatisticsDateTime", { value: formatted });
}

function tagLabel(
  coupon: PartnerCouponStatsRow | null,
  t: (key: string) => string,
) {
  if (!coupon) return "—";
  const expired =
    coupon?.expiryDate && new Date(coupon.expiryDate) < new Date();
  return expired || coupon?.isActive === false
    ? t("partnerCouponPillExpired")
    : t("partnerCouponPillActive");
}

function shortOrderId(uuid: string): string {
  const id = String(uuid ?? "").trim();
  if (id.length <= 8) return id || "—";
  return id.slice(0, 8).toUpperCase();
}

function StatPair({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0">
      <div className="font-sans font-medium text-xs leading-[18px] text-black">
        {label}
      </div>
      <div className="font-sans font-semibold text-base leading-6 text-black truncate">
        {value}
      </div>
    </div>
  );
}

function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 rounded-[5px] bg-[#E3FFD5] font-sans font-medium text-xs leading-[15px] text-[#3D743A] whitespace-nowrap">
      {children}
    </span>
  );
}

function CouponOrderCard({
  order,
  t,
  locale,
}: {
  order: PartnerCouponOrderRow;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const statusLabel = translateOrderDisplayStatus(order.status, t);

  return (
    <article className="rounded-[5px] border border-black/10 bg-[#FAFAFA] p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-sans text-sm font-semibold text-black m-0">
            {t("partnerCouponStatisticsOrderNumber", {
              id: shortOrderId(order.uuid),
            })}
          </p>
          <p className="mt-1 font-sans text-xs text-black/55 m-0">
            {formatCouponDateLabel(order.createdAt, t, locale)}
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center rounded-[5px] bg-[#ECEFF1] px-2.5 py-1 font-sans text-xs font-medium text-black">
          {statusLabel}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <p className="font-sans text-xs font-medium text-black/70 m-0">
            {t("partnerCouponStatisticsTotal")}
          </p>
          <p className="font-sans text-base font-semibold text-black m-0 mt-0.5 tabular-nums">
            {formatPartnerCouponOrderMoney(order.total, order.totalCurrency, locale)}
          </p>
        </div>
        <div>
          <p className="font-sans text-xs font-medium text-black/70 m-0">
            {t("partnerCouponStatisticsCommission")}
          </p>
          <p className="font-sans text-base font-semibold text-[#CB262E] m-0 mt-0.5 tabular-nums">
            {formatPartnerCouponOrderMoney(
              order.commission,
              order.commissionCurrency,
              locale,
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

function defaultStatsNormalize(raw: unknown): PartnerCouponStatsRow[] {
  if (Array.isArray(raw)) return raw as PartnerCouponStatsRow[];
  return [];
}

export default function PartnerCouponStatisticsPanel({
  fetchEndpoint,
  normalize = defaultStatsNormalize,
  referralCouponDetail = false,
}: {
  fetchEndpoint?: string;
  normalize?: (raw: unknown) => PartnerCouponStatsRow[];
  /** When true, loads coupon + orders via referral REST + `GetCouponOrders` GraphQL. */
  referralCouponDetail?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const currency = "QAR";
  const searchParams = useSearchParams();
  const couponUuid = searchParams.get("couponId")?.trim() ?? "";
  const couponCodeFromUrl = searchParams.get("couponCode")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PartnerCouponStatsRow[]>([]);
  const [couponDetail, setCouponDetail] = useState<PartnerCouponStatsRow | null>(
    null,
  );
  const [orderRows, setOrderRows] = useState<PartnerCouponOrderRow[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);

  const loadCouponOrders = useCallback(
    async (token: string, uuid: string, page: number, append: boolean) => {
      const { getCouponOrders } = await fetchCouponOrders(
        {
          uuid,
          pageNumber: page,
          itemsPerPage: COUPON_ORDERS_PAGE_SIZE,
        },
        token,
      );
      const mapped = gqlCouponOrdersToPartnerRows(getCouponOrders, currency);
      setOrderRows((prev) => (append ? [...prev, ...mapped] : mapped));
      setHasMoreOrders(mapped.length >= COUPON_ORDERS_PAGE_SIZE);
      setOrdersPage(page);
    },
    [currency],
  );

  useEffect(() => {
    const run = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setItems([]);
        setCouponDetail(null);
        setOrderRows([]);
        setLoading(false);
        return;
      }

      if (referralCouponDetail) {
        if (!couponUuid) {
          setItems([]);
          setCouponDetail(null);
          setOrderRows([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        setCouponDetail(null);
        setOrderRows([]);
        setOrdersPage(1);
        setHasMoreOrders(false);
        try {
          const [detail] = await Promise.all([
            fetchReferralCouponDetail(token, couponUuid),
            loadCouponOrders(token, couponUuid, 1, false),
          ]);
          setCouponDetail(detail);
          setItems(detail ? [detail] : []);
        } catch {
          setCouponDetail(null);
          setItems([]);
          setOrderRows([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!fetchEndpoint) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiFetch(fetchEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json().catch(() => ({}));
        const list = normalize(data);
        setItems(Array.isArray(list) ? list : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [
    referralCouponDetail,
    couponUuid,
    fetchEndpoint,
    normalize,
    loadCouponOrders,
  ]);

  const handleLoadMoreOrders = async () => {
    const token = Cookies.get("token");
    if (!token || !couponUuid || loadingMoreOrders || !hasMoreOrders) return;
    setLoadingMoreOrders(true);
    try {
      await loadCouponOrders(token, couponUuid, ordersPage + 1, true);
    } catch {
      setHasMoreOrders(false);
    } finally {
      setLoadingMoreOrders(false);
    }
  };

  const selectedCoupon = useMemo(() => {
    if (referralCouponDetail) {
      if (couponDetail) return couponDetail;
      if (!couponUuid) return null;
      return {
        id: couponUuid,
        code: couponCodeFromUrl || "—",
        status: "active",
        discount: "0",
        discountPercentage: 0,
        createdAt: null,
        expiryDate: null,
        isActive: true,
        usage: orderRows.length,
        orders: [],
      } satisfies PartnerCouponStatsRow;
    }
    const q = searchParams.get("couponId") || searchParams.get("couponCode");
    if (!q) return items[0] || null;
    return (
      items.find(
        (c) =>
          String(c?.id || c?._id || c?.code) === q || String(c?.code) === q,
      ) ||
      items[0] ||
      null
    );
  }, [
    items,
    searchParams,
    referralCouponDetail,
    couponUuid,
    couponDetail,
    couponCodeFromUrl,
    orderRows.length,
  ]);

  type OrderRow = Record<string, unknown>;

  const legacyOrders: unknown[] = referralCouponDetail
    ? []
    : Array.isArray(selectedCoupon?.orders)
      ? selectedCoupon.orders
      : [];

  const totalOrders = referralCouponDetail
    ? orderRows.length
    : legacyOrders.length;

  const totalSales = referralCouponDetail
    ? orderRows.reduce((sum, o) => sum + o.total, 0)
    : legacyOrders.reduce(
        (sum: number, o) => sum + Number((o as OrderRow)?.total ?? 0),
        0,
      );

  const totalCommission = referralCouponDetail
    ? orderRows.reduce((sum, o) => sum + o.commission, 0)
    : legacyOrders.reduce(
        (sum: number, o) => sum + Number((o as OrderRow)?.commission ?? 0),
        0,
      );

  const summaryCurrency =
    orderRows[0]?.totalCurrency ||
    (legacyOrders[0] as OrderRow | undefined)?.currency?.toString?.() ||
    currency;

  const uniqueBuyers = referralCouponDetail
    ? 0
    : new Set(
        legacyOrders
          .map(
            (o) =>
              (o as OrderRow)?.buyerEmail ||
              (o as OrderRow)?.buyerName ||
              (o as OrderRow)?.buyerId,
          )
          .filter(Boolean),
      ).size;

  const firstLegacyOrder = (legacyOrders[0] as OrderRow | undefined) ?? null;
  const legacyOrderProducts: unknown[] = Array.isArray(firstLegacyOrder?.products)
    ? (firstLegacyOrder.products as unknown[])
    : [];

  const showReferralMissingId =
    referralCouponDetail && !couponUuid && !loading;
  const showReferralNotFound =
    referralCouponDetail &&
    Boolean(couponUuid) &&
    !loading &&
    !couponDetail &&
    orderRows.length === 0;
  const referralDetailLoading =
    referralCouponDetail && Boolean(couponUuid) && loading;
  const showSummaryBlock =
    !showReferralMissingId &&
    !showReferralNotFound &&
    !referralDetailLoading &&
    (selectedCoupon != null || !referralCouponDetail);

  const hasOrdersToShow = referralCouponDetail
    ? orderRows.length > 0
    : Boolean(firstLegacyOrder);

  return (
    <AccountPanelSurface className="min-h-0">
      <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444] m-0">
        {t("partnerCouponStatisticsTitle")}
      </h1>

      {showReferralMissingId ? (
        <p className="mt-4 mb-0 max-w-[710px] font-sans text-sm text-black/70">
          {t("partnerCouponStatisticsMissingId")}
        </p>
      ) : null}

      {showReferralNotFound ? (
        <p className="mt-4 mb-0 max-w-[710px] font-sans text-sm text-[#CB262E]">
          {t("partnerCouponStatisticsNotFound")}
        </p>
      ) : null}

      {showSummaryBlock ? (
        <div className="mt-5 sm:mt-6 w-full max-w-[710px] border border-[#D9D9D9] rounded-[5px] bg-white p-4 sm:p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="font-sans font-medium text-base leading-6 capitalize text-black truncate">
              {selectedCoupon?.code || "—"}
            </span>
            <span className="font-sans font-semibold text-xs leading-[18px] capitalize text-black line-clamp-2">
              {formatCouponDateLabel(selectedCoupon?.createdAt, t, locale)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <InfoPill>{tagLabel(selectedCoupon, t)}</InfoPill>
            <InfoPill>
              {t("partnerCouponDiscountPct", {
                percent:
                  selectedCoupon?.discountPercentage ??
                  selectedCoupon?.discount ??
                  0,
              })}
            </InfoPill>
            {selectedCoupon?.commissionPercentage !== undefined ||
            selectedCoupon?.commission !== undefined ? (
              <InfoPill>
                {t("partnerCouponCommissionPct", {
                  percent:
                    selectedCoupon?.commissionPercentage ??
                    selectedCoupon?.commission ??
                    0,
                })}
              </InfoPill>
            ) : null}
          </div>

          <div
            className={`grid gap-4 sm:gap-6 pt-2 border-t border-black/10 ${
              referralCouponDetail
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            <StatPair label={t("partnerCouponStatisticsTotalOrders")} value={totalOrders} />
            <StatPair
              label={t("partnerCouponStatisticsTotalSales")}
              value={formatMoneyValue(totalSales, summaryCurrency, locale)}
            />
            <StatPair
              label={t("partnerCouponStatisticsTotalCommission")}
              value={formatMoneyValue(totalCommission, summaryCurrency, locale)}
            />
            {!referralCouponDetail ? (
              <StatPair
                label={t("partnerCouponStatisticsUniqueBuyers")}
                value={uniqueBuyers}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <h2 className="font-sans font-medium text-base leading-6 capitalize text-black m-0 mt-6 sm:mt-8">
        {t("partnerCouponStatisticsOrdersHeading")}
      </h2>

      <div className="mt-3 sm:mt-4 w-full max-w-[710px] border border-[#D9D9D9] rounded-[5px] bg-white p-3 sm:p-4 max-h-[min(60vh,520px)] sm:max-h-[660px] overflow-y-auto overflow-x-hidden">
        {loading ? (
          <p className="font-sans text-sm text-black/70 m-0">
            {t("partnerCouponStatisticsLoading")}
          </p>
        ) : !hasOrdersToShow ? (
          <div className="flex flex-col justify-center items-center gap-3 py-8 px-4 min-h-[170px]">
            <svg
              width={50}
              height={50}
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle cx="25" cy="25" r="25" fill="#CB262E" />
              <path
                d="M27.5 35H21.13C21.44 34.74 21.71 34.42 21.92 34.06C22.29 33.46 22.5 32.75 22.5 32C22.5 29.79 20.71 28 18.5 28C17.56 28 16.69 28.33 16 28.88V24.51C16 22.44 17.69 20.75 19.76 20.75H31.24C33.31 20.75 35 22.44 35 24.51V25.95H32.98C32.42 25.95 31.91 26.17 31.54 26.55C31.12 26.96 30.88 27.55 30.94 28.18C31.03 29.26 32.02 30.05 33.1 30.05H35V31.24C35 33.31 33.31 35 31.24 35"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-sans font-medium text-base leading-6 text-center text-black max-w-[279px]">
              {t("partnerCouponStatisticsNoOrders")}
            </span>
          </div>
        ) : referralCouponDetail ? (
          <div className="flex flex-col gap-3">
            {orderRows.map((order) => (
              <CouponOrderCard
                key={order.uuid}
                order={order}
                t={t}
                locale={locale}
              />
            ))}
            {hasMoreOrders ? (
              <button
                type="button"
                onClick={() => void handleLoadMoreOrders()}
                disabled={loadingMoreOrders}
                className="mt-1 min-h-[44px] w-full rounded-[5px] border border-black/20 font-sans text-sm font-medium text-black transition-colors hover:bg-black/[0.04] disabled:opacity-50"
              >
                {loadingMoreOrders
                  ? t("partnerCouponStatisticsLoading")
                  : t("partnerCouponStatisticsLoadMore")}
              </button>
            ) : null}
          </div>
        ) : (
          <LegacyOrderDetail
            firstOrder={firstLegacyOrder}
            orderProducts={legacyOrderProducts}
            currency={currency}
            locale={locale}
            t={t}
          />
        )}
      </div>
    </AccountPanelSurface>
  );
}

type LegacyOrderDetailProps = {
  firstOrder: Record<string, unknown> | null;
  orderProducts: unknown[];
  currency: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
};

function asDisplayString(v: unknown, fallback: string): string {
  if (v == null || v === "") return fallback;
  if (typeof v === "string" || typeof v === "number") return String(v);
  return fallback;
}

function LegacyProductCard({
  product,
  index,
  t,
  currency,
  locale,
}: {
  product: Record<string, unknown>;
  index: number;
  t: ReturnType<typeof useTranslations>;
  currency: string;
  locale: string;
}) {
  const imageRaw =
    product?.image ||
    product?.thumbnail ||
    product?.productImage ||
    product?.imageUrl ||
    "";
  const image = typeof imageRaw === "string" ? imageRaw : "";
  const qty = Number(product?.quantity ?? 1) || 1;
  const sizeColor = [
    product?.size
      ? t("partnerCouponStatisticsSize", {
          value: asDisplayString(product.size, "—"),
        })
      : null,
    product?.color
      ? t("partnerCouponStatisticsColor", {
          value: asDisplayString(product.color, "—"),
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full min-w-0 p-2 sm:px-4 sm:py-2 bg-[#ECEFF1] rounded-[5px] min-h-[100px] sm:min-h-[120px]">
      <div
        className="w-[72px] h-[92px] sm:w-20 sm:h-[104px] shrink-0 rounded-[5px] bg-[#E3E7EA] bg-cover bg-center"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
        role={image ? "img" : undefined}
        aria-label={
          image
            ? asDisplayString(
                product?.name,
                t("partnerCouponStatisticsProductImageLabel"),
              )
            : undefined
        }
      />
      <div className="flex flex-col gap-2 sm:gap-3 min-w-0 flex-1 justify-center">
        <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
          <span className="font-sans font-normal text-[8px] leading-3 text-black">
            {asDisplayString(
              product?.category,
              t("partnerCouponStatisticsCategoryFallback"),
            )}
          </span>
          <span className="font-sans font-semibold text-xs sm:text-sm leading-[18px] text-black line-clamp-2">
            {asDisplayString(
              product?.name ?? product?.title,
              t("partnerCouponStatisticsProductFallback", { number: index + 1 }),
            )}
          </span>
          <span className="font-sans font-normal text-[8px] leading-3 text-black line-clamp-2">
            {sizeColor || "—"}
          </span>
        </div>
        <div className="flex flex-row items-center justify-between gap-2 min-w-0">
          <span className="font-sans font-semibold text-sm leading-6 text-black truncate">
            {formatMoneyValue(product?.price || product?.total || 0, currency, locale)}
          </span>
          <span className="font-sans font-normal text-xs leading-[18px] text-black/60 shrink-0">
            {t("partnerCouponStatisticsQty", { count: qty })}
          </span>
        </div>
      </div>
    </div>
  );
}

function LegacyOrderDetail({
  firstOrder,
  orderProducts,
  currency,
  locale,
  t,
}: LegacyOrderDetailProps) {
  if (!firstOrder) return null;

  return (
    <>
      <div className="font-sans font-semibold text-base leading-6 text-black">
        {t("partnerCouponStatisticsOrderNumber", {
          id: asDisplayString(
            firstOrder?.wcOrderId ?? firstOrder?.orderId,
            "—",
          ),
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <div className="font-sans font-medium text-xs leading-[18px]">
            {t("partnerCouponStatisticsCustomerName")}
          </div>
          <div className="font-sans font-semibold text-base leading-6 break-words">
            {asDisplayString(firstOrder?.buyerName, "—")}
          </div>
        </div>
        <div>
          <div className="font-sans font-medium text-xs leading-[18px]">
            {t("partnerCouponStatisticsCommission")}
          </div>
          <div className="font-sans font-semibold text-base leading-6">
            {formatMoneyValue(firstOrder?.commission, currency, locale)}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="font-sans font-medium text-xs leading-[18px]">
          {t("partnerCouponStatisticsEmail")}
        </div>
        <div className="font-sans font-semibold text-base leading-[18px] break-all">
          {asDisplayString(firstOrder?.buyerEmail, "—")}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div className="font-sans font-medium text-xs leading-[18px]">
            {t("partnerCouponStatisticsProductCount")}
          </div>
          <div className="font-sans font-semibold text-base leading-6">
            {orderProducts.length}
          </div>
        </div>
        <div>
          <div className="font-sans font-medium text-xs leading-[18px]">
            {t("partnerCouponStatisticsTotal")}
          </div>
          <div className="font-sans font-semibold text-base leading-6">
            {formatMoneyValue(firstOrder?.total, currency, locale)}
          </div>
        </div>
      </div>

      <div className="mt-4 font-sans font-medium text-base leading-6">
        {t("partnerCouponStatisticsProducts")}
      </div>
      <div className="mt-3 flex flex-col gap-4 sm:gap-5">
        {(orderProducts.length ? orderProducts : [{}, {}, {}])
          .slice(0, 3)
          .map((p, i) => (
            <LegacyProductCard
              key={`${i}-${String((p as Record<string, unknown>)?.id ?? (p as Record<string, unknown>)?.name ?? "p")}`}
              product={p as Record<string, unknown>}
              index={i}
              t={t}
              currency={currency}
              locale={locale}
            />
          ))}
      </div>
    </>
  );
}
