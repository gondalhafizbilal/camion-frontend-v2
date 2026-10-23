import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import CmsLegalDocument from "@/componentsedit/cms/CmsLegalDocument";
import { fetchCmsPageBySlug } from "@/services/graphql/operations/cmsPages";

const FAQ_SLUG = "frequently-asked-questions";

export default async function AccountFrequentlyAskedQuestionsPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("token")?.value ?? null;
  const locale = await getLocale();
  const t = await getTranslations();
  const { page } = await fetchCmsPageBySlug({ slug: FAQ_SLUG }, authToken, locale);

  const title =
    page?.title?.trim() || t("frequentlyAskedQuestions") || "Frequently Asked Questions";
  const content =
    page?.content?.trim() ||
    `<p>${t("somethingWentWrong") || "Content is not available at the moment."}</p>`;

  return (
    <CmsLegalDocument
      title={title}
      subtitle={t("frequentlyAskedQuestions")}
      lastUpdated={page?.updatedAt ?? page?.createdAt ?? null}
      content={content}
      faqLayout
    />
  );
}
