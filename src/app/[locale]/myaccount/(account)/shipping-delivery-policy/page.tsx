import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import CmsLegalDocument from "@/componentsedit/cms/CmsLegalDocument";
import { fetchCmsPageBySlug } from "@/services/graphql/operations/cmsPages";

const SHIPPING_DELIVERY_POLICY_CMS_SLUG = "shipping-delivery-policies";

export default async function AccountShippingDeliveryPolicyPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("token")?.value ?? null;
  const locale = await getLocale();
  const t = await getTranslations();
  const { page } = await fetchCmsPageBySlug(
    { slug: SHIPPING_DELIVERY_POLICY_CMS_SLUG },
    authToken,
    locale,
  );

  const title = page?.title?.trim() || t("shippingPolicy") || "Shipping Policy";
  const content =
    page?.content?.trim() ||
    `<p>${t("somethingWentWrong") || "Content is not available at the moment."}</p>`;

  return (
    <CmsLegalDocument
      title={title}
      subtitle={t("shippingPolicy")}
      lastUpdated={page?.updatedAt ?? page?.createdAt ?? null}
      content={content}
    />
  );
}
