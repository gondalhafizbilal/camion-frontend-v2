"use client";

import type { CarouselProductCampaign } from "@/componentsedit/home/ProductCarouselSection";
import { PRODUCT_CAMPAIGN_BAR_SLOT_CLASS } from "@/lib/styles/carouselCardLayout";
import ProductCampaignCountdownBar from "@/componentsedit/products/ProductCampaignCountdownBar";

type ProductCampaignBarSlotProps = {
  campaign?: CarouselProductCampaign | null;
};

/** Fixed-height slot so product tiles stay aligned whether or not a campaign is active. */
export default function ProductCampaignBarSlot({
  campaign,
}: ProductCampaignBarSlotProps) {
  return (
    <div className={PRODUCT_CAMPAIGN_BAR_SLOT_CLASS} aria-hidden={!campaign}>
      {campaign ? (
        <ProductCampaignCountdownBar
          campaign={campaign}
          className="h-full min-h-0 py-0"
        />
      ) : null}
    </div>
  );
}
