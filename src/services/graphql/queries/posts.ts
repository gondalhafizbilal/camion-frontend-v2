export const GET_POSTS = `
query GetPosts($language: String!) {
  getPosts {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    content(language: $language)
    enabled
    images
    createdBy {
      uuid
      fullName
    }
  }
}
`.trim();

export type GetPostVariables = {
  slug: string;
  language: string;
};

export const GET_POST = `
query GetPost($slug: String!, $language: String!) {
  getPost(slug: $slug) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    content(language: $language)
    enabled
    images
    createdBy {
      uuid
      fullName
    }
  }
}
`.trim();
