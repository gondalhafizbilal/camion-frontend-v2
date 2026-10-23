export function getTransformedImageUrl(
  imageUrl: string,
  assetsHost: string,
): string {
  const url = String(imageUrl || "").trim();
  const host = String(assetsHost || "").trim().replace(/\/$/, "");
  if (!url || !host) return "";

  if (url.startsWith("https:")) {
    return url.replace(
      "https://dev-assets-167781471441-eu-north-1.s3.eu-north-1.amazonaws.com",
      host,
    );
  }
  if (url.startsWith("s3:")) {
    // Converts `s3://product-images/...` into `${assetsHost}/product-images/...`
    return url.replace("s3:/", host);
  }

  return "";
}

