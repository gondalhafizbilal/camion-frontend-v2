import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import CmsLegalDocument from "@/componentsedit/cms/CmsLegalDocument";
import { fetchCmsPageBySlug } from "@/services/graphql/operations/cmsPages";

const REPORT_PRODUCT_CMS_SLUG = "report-product";

export default async function AccountReportAProductPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("token")?.value ?? null;
  const locale = await getLocale();
  const t = await getTranslations();
  const { page } = await fetchCmsPageBySlug(
    { slug: REPORT_PRODUCT_CMS_SLUG },
    authToken,
    locale,
  );

  const title = page?.title?.trim() || t("reportAProduct") || "Report a Product";
  const content =
    page?.content?.trim() ||
    `<p>${t("somethingWentWrong") || "Content is not available at the moment."}</p>`;

  return (
    <CmsLegalDocument
      title={title}
      subtitle={t("helpAndSupport")}
      lastUpdated={page?.updatedAt ?? page?.createdAt ?? null}
      content={content}
    />
  );
}
