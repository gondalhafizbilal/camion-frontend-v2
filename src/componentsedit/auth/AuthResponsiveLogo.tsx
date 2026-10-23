import Image from "@/componentsedit/StaticImage";

type AuthResponsiveLogoProps = {
  alt?: string;
  className?: string;
};

export default function AuthResponsiveLogo({
  alt = "Camion",
  className = "",
}: AuthResponsiveLogoProps) {
  return (
    <div
      className={[
        "flex w-full justify-center px-4 pb-3 pt-4 sm:pb-4 sm:pt-5 lg:hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Mobile (< md) */}
      <div className="block md:hidden">
        <Image
          src="/assets/icons/web1.svg"
          alt={alt}
          width={220}
          height={36}
          className="h-9 w-auto sm:h-11"
          priority
        />
      </div>

      {/* Tablet (md to < lg) */}
      <div className="hidden md:block">
        <Image
          src="/assets/icons/logo_v2_red.svg"
          alt={alt}
          width={156}
          height={62}
          className="h-12 w-auto"
          priority
        />
      </div>
    </div>
  );
}

