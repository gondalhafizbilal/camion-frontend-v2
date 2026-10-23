"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { Frown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { fetchCurrentCustomerOrder, gqlMoneyToNumber, gqlMoneyToNumberOrZero } from "@/services/graphql";
import { resolveOrderDisplayStatus } from "@/lib/order/orderDisplayStatus";
import type { GqlOrderProduct } from "@/services/graphql/types/order";
import { parseOrderLineVariations } from "@/lib/order/orderLineVariations";
import {
  coalesceProductImagePair,
  PRODUCT_IMAGE_FALLBACK,
  resolveCartLineImagePair,
} from "@/lib/productImageFallback";
import OrderDetailCenterContent from "@/app/[locale]/track-order/[id]/_components/OrderDetailCenterContent";
import type { OrderDetailShape } from "@/types/checkoutDisplay";

function orderLineCategoryName(
  product: GqlOrderProduct | null | undefined,
  locale: string,
): string {
  const cat = product?.productCategories?.[0]?.category;
  if (!cat) return "—";
  const isAr = locale === "ar";
  const raw = isAr
    ? cat.nameAr || cat.name || cat.nameEn
    : cat.nameEn || cat.name || cat.nameAr;
  const s = String(raw ?? "").trim();
  return s || "—";
}

const sectionStyle: CSSProperties = {
  background: "#FFFFFF",
  boxShadow: "0px 1px 13px rgba(0, 0, 0, 0.05)",
  borderRadius: 4,
  minHeight: 400,
  padding: "40px clamp(16px, 4vw, 80px)",
};

export default function AccountOrderDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const [order, setOrder] = useState<OrderDetailShape | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();
  const locale = useLocale();
  const token = Cookies.get("token");

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (!token) throw new Error("Missing auth token");
      const language = locale === "ar" ? "ar" : "en";
      const data = await fetchCurrentCustomerOrder(
        { uuid: String(id), language, currency: "QAR" },
        token ?? null,
      );
      const o = data?.getCurrentCustomerOrder;
      if (!o) throw new Error("Order not found");

      const mapped: OrderDetailShape = {
        orderUuid: o.uuid,
        items: (o.orderItems ?? []).map((it) => {
          const imgs = Array.isArray(it.variant?.images) ? it.variant?.images : [];
          const featured =
            imgs.find((x) => x?.isFeatured) ??
            imgs
              .slice()
              .sort((a, b) => Number(a?.position ?? 0) - Number(b?.position ?? 0))[0];
          const rawImgPick = String(
            featured?.imageUrl ?? featured?.thumbnailUrl ?? "",
          ).trim();
          const rawThumbPick = String(
            featured?.thumbnailUrl ?? featured?.imageUrl ?? "",
          ).trim();
          const variantPair = coalesceProductImagePair(
            rawThumbPick || rawImgPick,
            rawImgPick || rawThumbPick,
          );
          const resolved = resolveCartLineImagePair({
            featuredThumbnailUrl: it.product?.featuredThumbnailUrl,
            featuredImageUrl: it.product?.featuredImageUrl,
            variantPair,
          });
          const image = resolved.src || resolved.thumb || PRODUCT_IMAGE_FALLBACK;
          return {
            id: it.uuid,
            categoryName: orderLineCategoryName(it.product, locale),
            title: it.product?.title ?? it.variant?.title ?? t("product"),
            name: it.product?.title ?? it.variant?.title ?? t("product"),
            variation: parseOrderLineVariations(it.variant, t("variantOption")),
            price:
              gqlMoneyToNumber(it.price) ??
              gqlMoneyToNumber(it.variant?.discountedPrice) ??
              gqlMoneyToNumber(it.variant?.price) ??
              0,
            quantity: Number(it.quantity ?? 1) || 1,
            image,
            slug: it.product?.slug ?? undefined,
            productUuid: it.product?.uuid ?? undefined,
          };
        }),
        statusDisplay: resolveOrderDisplayStatus(o),
        orderStatus: o.status ?? undefined,
        discount: gqlMoneyToNumberOrZero(o.discount),
        grandTotal: gqlMoneyToNumberOrZero(o.total),
        isPaid: String(o.status ?? "")
          .toLowerCase()
          .includes("paid"),
        customer_data: {
          shipping_option: { cost: gqlMoneyToNumberOrZero(o.shippingCost) },
          shipping_address: o.shippingAddress
            ? {
                fullName: o.shippingAddress.fullName,
                phoneNumber: o.shippingAddress.phoneNumber,
                streetAddress: o.shippingAddress.streetAddress,
                apartment: o.shippingAddress.apartment,
                zipCode: o.shippingAddress.zipCode,
                city: o.shippingAddress.city,
                state: o.shippingAddress.state,
                country: o.shippingAddress.country,
              }
            : null,
        },
      };

      setOrder(mapped);
    } catch (err) {
      console.error("Error fetching order:", err);
      toast.error(t("loadOrderError"));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, token, t, locale]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <section className="w-full" style={sectionStyle}>
        <span
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontSize: 14,
          }}
        >
          {t("loadingOrderDetails")}
        </span>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="w-full" style={sectionStyle}>
        <div className="flex flex-col justify-center items-center min-h-[40vh] text-gray-600">
          <Frown size={48} className="mb-4 text-gray-400" />
          <p className="text-lg font-semibold">{t("noOrderFound")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full" style={sectionStyle}>
      <div className="w-full flex justify-center mt-0 print:mt-0">
        <OrderDetailCenterContent order={order} onOrderCancelled={fetchOrder} />
      </div>
    </section>
  );
}
