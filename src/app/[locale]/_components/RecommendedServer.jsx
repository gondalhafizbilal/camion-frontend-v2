import RecommendedClient from "./RecommendedClient.jsx";
import { fetchPopularProducts } from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import { routing } from "@/i18n/routing";
import { cookies } from "next/headers";
import { CURRENCY_STORAGE_KEY } from "@/lib/currency/currencyStorage";

export default async function RecommendedServer({ locale = routing.defaultLocale } = {}) {
  try {
    const cookieStore = await cookies();
    const data = await fetchPopularProducts({
      language: locale,
      currency: String(cookieStore.get(CURRENCY_STORAGE_KEY)?.value ?? "QAR").toLowerCase(),
      pageNumber: 1,
      itemsPerPage: 10,
    });
    const list = (data.getPopularProducts ?? []).map(gqlProductToCarouselProduct);
    return <RecommendedClient initialProducts={list} />;
  } catch (e) {
    console.error("[RecommendedServer] GraphQL:", e);
    return <RecommendedClient initialProducts={[]} />;
  }
}
