import { useEffect, useState } from "react";
import Image from "@/componentsedit/StaticImage";
import {
  PRODUCT_IMAGE_FALLBACK,
  productImageUrlOrFallback,
} from "@/lib/productImageFallback";

export function ImageWithSkeleton({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [activeSrc, setActiveSrc] = useState(() => productImageUrlOrFallback(src));

  useEffect(() => {
    setActiveSrc(productImageUrlOrFallback(src));
    setLoaded(false);
  }, [src]);

  return (
    <div className="w-full h-full relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-300 w-36 h-40 rounded-lg" />
        </div>
      )}
      <Image
        src={activeSrc}
        width={400}
        height={500}
        alt={alt}
        unoptimized
        className={`rounded-xl object-contain w-full h-full transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setActiveSrc(PRODUCT_IMAGE_FALLBACK);
          setLoaded(true);
        }}
      />
    </div>
  );
}
