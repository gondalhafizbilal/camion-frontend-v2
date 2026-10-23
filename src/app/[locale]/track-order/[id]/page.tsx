import { redirect } from "@/i18n/navigation";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function LegacyOrderDetailsRedirect({
  params,
}: PageProps) {
  const { locale, id } = await params;
  redirect({ href: `/myaccount/orders/${id}`, locale });
}
