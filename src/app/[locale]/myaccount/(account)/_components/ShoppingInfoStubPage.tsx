import { getTranslations } from "next-intl/server";
import CmsLegalDocument from "@/componentsedit/cms/CmsLegalDocument";
import type { ShoppingWithCamionTitleKey } from "@/lib/cms/shoppingWithCamionPages";

type ShoppingInfoStubPageProps = {
  titleKey: ShoppingWithCamionTitleKey;
};

/** Temporary page shell until CMS/file content is provided. */
export default async function ShoppingInfoStubPage({
  titleKey,
}: ShoppingInfoStubPageProps) {
  const t = await getTranslations();
  const title = t(titleKey);

  return (
    <CmsLegalDocument
      title={title}
      subtitle={t("shoppingWithCamion")}
      content=""
    />
  );
}
