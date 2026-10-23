import { getTranslations } from "next-intl/server";
import CmsLegalDocument from "@/componentsedit/cms/CmsLegalDocument";
import type { HelpAndSupportTitleKey } from "@/lib/cms/helpAndSupportPages";

type HelpSupportStubPageProps = {
  titleKey: HelpAndSupportTitleKey;
};

/** Temporary page shell until CMS/file content is provided. */
export default async function HelpSupportStubPage({
  titleKey,
}: HelpSupportStubPageProps) {
  const t = await getTranslations();
  const title = t(titleKey);

  return (
    <CmsLegalDocument
      title={title}
      subtitle={t("helpAndSupport")}
      content=""
    />
  );
}
