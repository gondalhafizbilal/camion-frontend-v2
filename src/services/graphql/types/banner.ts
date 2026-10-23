/** Banner row from `getBanners`. */

export type GqlBanner = {
  uuid: string;
  title?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  placement?: string | null;
  /** CMS text/accent color for overlay copy (hex, rgb, etc.). */
  color?: string | null;
  isActive?: boolean | null;
};

export type GetBannersData = {
  getBanners: GqlBanner[];
};
