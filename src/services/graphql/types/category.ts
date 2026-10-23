/** Category node from `getCategories` (API returns up to three levels). */

export type GqlCategoryGrandchild = {
  uuid: string;
  slug: string;
  name?: string | null;
  thumbnailUrl?: string | null;
};

export type GqlCategoryChild = {
  uuid: string;
  slug: string;
  name?: string | null;
  thumbnailUrl?: string | null;
  children?: GqlCategoryGrandchild[] | null;
};

export type GqlCategory = {
  uuid: string;
  slug: string;
  name?: string | null;
  thumbnailUrl?: string | null;
  children?: GqlCategoryChild[] | null;
};

export type GetCategoriesData = {
  getCategories: GqlCategory[];
};
