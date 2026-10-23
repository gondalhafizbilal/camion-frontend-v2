"use client";

import { useEffect, useState } from "react";
import Image from "@/componentsedit/StaticImage";
import {
  PRODUCT_IMAGE_FALLBACK,
  productImageUrlOrFallback,
} from "@/lib/productImageFallback";

type ProductDetailImageProps = {
  src: unknown;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** PDP image with catalog fallback + onError recovery (avoids broken-image icon). */
export default function ProductDetailImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority,
}: ProductDetailImageProps) {
  const resolved = productImageUrlOrFallback(src);
  const [activeSrc, setActiveSrc] = useState(resolved);

  useEffect(() => {
    setActiveSrc(productImageUrlOrFallback(src));
  }, [src]);

  return (
    <Image
      key={activeSrc}
      src={activeSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      unoptimized
      className={className}
      onError={() => {
        setActiveSrc((prev) =>
          prev !== PRODUCT_IMAGE_FALLBACK ? PRODUCT_IMAGE_FALLBACK : prev,
        );
      }}
    />
  );
}
