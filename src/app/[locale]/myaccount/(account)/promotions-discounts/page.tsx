import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import CmsLegalDocument from "@/componentsedit/cms/CmsLegalDocument";
import { fetchCmsPageBySlug } from "@/services/graphql/operations/cmsPages";

const PROMOTIONS_DISCOUNTS_CMS_SLUG = "promotion-discount";

export default async function AccountPromotionsDiscountsPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("token")?.value ?? null;
  const locale = await getLocale();
  const t = await getTranslations();
  const { page } = await fetchCmsPageBySlug(
    { slug: PROMOTIONS_DISCOUNTS_CMS_SLUG },
    authToken,
    locale,
  );

  const title =
    page?.title?.trim() || t("promotionsAndDiscounts") || "Promotions & Discounts";
  const content =
    page?.content?.trim() ||
    `<p>${t("somethingWentWrong") || "Content is not available at the moment."}</p>`;

  return (
    <CmsLegalDocument
      title={title}
      subtitle={t("shoppingWithCamion")}
      lastUpdated={page?.updatedAt ?? page?.createdAt ?? null}
      content={content}
    />
  );
}
