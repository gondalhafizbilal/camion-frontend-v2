/** True for `/[locale]/shop/[slug]` product detail routes (not shop listing). */
export function isProductDetailPathname(pathname: string | null): boolean {
  if (!pathname) return false;
  return /\/shop\/[^/]+/.test(pathname);
}
