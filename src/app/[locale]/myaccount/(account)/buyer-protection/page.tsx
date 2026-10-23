import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import CmsLegalDocument from "@/componentsedit/cms/CmsLegalDocument";
import { fetchCmsPageBySlug } from "@/services/graphql/operations/cmsPages";

const BUYER_PROTECTION_CMS_SLUG = "buyer-protection";

export default async function AccountBuyerProtectionPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("token")?.value ?? null;
  const locale = await getLocale();
  const t = await getTranslations();
  const { page } = await fetchCmsPageBySlug(
    { slug: BUYER_PROTECTION_CMS_SLUG },
    authToken,
    locale,
  );

  const title = page?.title?.trim() || t("buyerProtection") || "Buyer Protection";
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
