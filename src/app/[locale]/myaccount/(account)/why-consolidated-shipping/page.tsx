import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import CmsLegalDocument from "@/componentsedit/cms/CmsLegalDocument";
import { fetchCmsPageBySlug } from "@/services/graphql/operations/cmsPages";

const WHY_CONSOLIDATED_SHIPPING_CMS_SLUG = "why-consolidated-shipping";

export default async function AccountWhyConsolidatedShippingPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("token")?.value ?? null;
  const locale = await getLocale();
  const t = await getTranslations();
  const { page } = await fetchCmsPageBySlug(
    { slug: WHY_CONSOLIDATED_SHIPPING_CMS_SLUG },
    authToken,
    locale,
  );

  const title =
    page?.title?.trim() || t("whyConsolidatedShipping") || "Why Consolidated Shipping";
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
