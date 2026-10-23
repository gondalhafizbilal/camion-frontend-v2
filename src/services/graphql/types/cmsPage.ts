export type GqlCmsPage = {
  uuid?: string | null;
  slug?: string | null;
  title?: string | null;
  brief?: string | null;
  content?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  enabled?: boolean | null;
};

export type GetCmsPagesData = {
  getCmsPages?: GqlCmsPage[] | null;
};

export type GetCmsPageData = {
  getCmsPage?: GqlCmsPage | null;
};
