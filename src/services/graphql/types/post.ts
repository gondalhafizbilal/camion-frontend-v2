export type GqlPostAuthor = {
  uuid: string;
  fullName?: string | null;
};

export type GqlPost = {
  uuid: string;
  slug?: string | null;
  title?: string | null;
  brief?: string | null;
  content?: string | null;
  enabled?: boolean | null;
  images?: unknown;
  createdBy?: GqlPostAuthor | null;
};

