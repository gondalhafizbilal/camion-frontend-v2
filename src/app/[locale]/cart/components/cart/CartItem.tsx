"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import {
  getCheckoutLineSubTotal,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";
import CartLineProductMedia from "@/componentsedit/cart/CartLineProductMedia";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { clampCartQuantity, MAX_CART_QUANTITY } from "@/lib/cart/maxQuantity";

export default function CartItem({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CheckoutCartLine;
  onRemove: (productId: string | number) => void;
  onQuantityChange: (
    productId: string | number | undefined,
    qty: number,
  ) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const currencyCode = currency || "QAR";
  const productId = item.productId ?? item.product_id;
  const productSlug = item.slug || item.product_slug;
  const productDetailHref = productSlug ? `/shop/${productSlug}` : null;
  const qty = Number(item.quantity) || 0;
  const atMaxQty = qty >= MAX_CART_QUANTITY;
  const total = getCheckoutLineSubTotal(item);
  const imageAlt = item?.title || item?.name || "Product image";

  const handleIncrease = () => {
    if (atMaxQty) return;
    onQuantityChange(productId, clampCartQuantity(qty + 1));
  };

  const handleDecrease = () => {
    onQuantityChange(productId, qty > 1 ? qty - 1 : 1);
  };

  return (
    <main className="flex flex-col gap-4">
      <div className="rounded-lg p-5 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-5 w-full md:w-2/3">
          <CartLineProductMedia
            item={item}
            alt={imageAlt}
            href={productDetailHref}
            imageWidth={96}
            imageHeight={96}
            className="h-24 w-24 shrink-0"
            imageClassName="aspect-square h-24 w-24 object-contain rounded-md"
            showCampaign={false}
          />

          <div className="flex-1">
            <p className="text-gray-800 text-sm md:text-lg font-semibold line-clamp-1">
              {item.title || item.name || "Unnamed Product"}
            </p>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              {t("freeDeliveryMessage")}
            </p>

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={handleDecrease}
                className="w-8 h-8 cursor-pointer rounded-full bg-red-100 text-[#B92123] font-bold flex items-center justify-center"
              >
                -
              </button>
              <span className="text-sm font-medium">{item.quantity}</span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={atMaxQty}
                className="w-8 h-8 cursor-pointer rounded-full bg-red-100 text-[#B92123] font-bold flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            {productId != null && (
              <button
                type="button"
                onClick={() => onRemove(productId)}
                className="text-sm cursor-pointer text-[#B92123] mt-2 hover:underline"
              >
                {t("removeItem")}
              </button>
            )}
          </div>
        </div>

        <div dir="ltr" className="text-end w-full md:w-1/3">
          <p className="text-gray-800 text-sm md:text-lg font-medium mb-2">
            {t("cartItemTotal")}: {formatAmountWithCurrency(total, currencyCode, locale)}
          </p>
        </div>
      </div>
    </main>
  );
}
