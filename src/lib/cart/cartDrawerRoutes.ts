/** Close the side cart when the user enters account, full cart, or checkout flows. */
export function shouldCloseCartDrawerForPathname(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.includes("/myaccount") ||
    pathname.includes("/cart") ||
    pathname.includes("/checkout")
  );
}
