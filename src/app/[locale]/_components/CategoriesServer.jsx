import { resolveServerGraphqlToken } from "@/services/auth/guestRegisterServer";
import { fetchCategories } from "@/services/graphql";
import CategoriesClient from "./CategoriesClient.jsx";

export default async function CategoriesServer() {
  try {
    const token = await resolveServerGraphqlToken();
    const { getCategories } = await fetchCategories(
      { language: "en", pageNumber: 1, itemsPerPage: 200 },
      token,
    );
    const rows = (getCategories ?? []).map((c) => {
      const thumb = (c.thumbnailUrl ?? "").trim();
      return {
        id: c.uuid,
        uuid: c.uuid,
        slug: c.slug,
        name: c.name ?? c.slug,
        image: thumb ? { thumbnail: thumb, src: thumb } : undefined,
      };
    });
    return <CategoriesClient initialCategories={rows} />;
  } catch (e) {
    return <CategoriesClient initialCategories={[]} />;
  }
}
