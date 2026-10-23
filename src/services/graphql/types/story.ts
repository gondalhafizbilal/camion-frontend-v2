/** Story frame from `getStories`. */

export type GqlStoryFrame = {
  uuid: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | string | null;
  order?: number | null;
};

export type GqlStory = {
  uuid: string;
  caption?: string | null;
  isHighlighted?: boolean | null;
  frames?: GqlStoryFrame[] | null;
};

export type GetStoriesData = {
  getStories: GqlStory[];
};
