"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const SECTION_GAP = 40;
const ROW_GAP = 32;
const CARD_GAP = 30;
const CARD_WIDTH = 270;
const CARD_HEIGHT = 284;

const DUMMY_BRANDS = [
  { id: 1, title: "Speakers", subtitle: "Amazon wireless speakers", href: "/shop" },
  { id: 2, title: "Perfume", subtitle: "GUCCI INTENSE OUD EDP", href: "/shop" },
  { id: 3, title: "Speakers", subtitle: "Amazon wireless speakers", href: "/shop" },
  { id: 4, title: "Perfume", subtitle: "GUCCI INTENSE OUD EDP", href: "/shop" },
  { id: 5, title: "Perfume", subtitle: "GUCCI INTENSE OUD EDP", href: "/shop" },
  { id: 6, title: "Speakers", subtitle: "Amazon wireless speakers", href: "/shop" },
  { id: 7, title: "Perfume", subtitle: "GUCCI INTENSE OUD EDP", href: "/shop" },
  { id: 8, title: "Speakers", subtitle: "Amazon wireless speakers", href: "/shop" },
];

type DummyBrand = (typeof DUMMY_BRANDS)[number];

function BrandCard({ brand }: { brand: DummyBrand }) {
  const t = useTranslations();

  return (
    <Link
      href={brand.href || "/shop"}
      className="relative flex flex-col flex-shrink-0 overflow-hidden rounded-[4px] bg-black group"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(circle, rgba(217, 217, 217, 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        className="relative flex-shrink-0 flex items-center justify-center bg-black"
        style={{ height: 175 }}
        aria-hidden
      >
        <div className="w-full h-full flex items-center justify-center" aria-hidden />
      </div>
      <div
        className="relative flex flex-col flex-1 min-h-0 px-6 pt-2 pb-6"
        style={{ gap: 8 }}
      >
        <div className="flex flex-col" style={{ gap: 8 }}>
          <h3
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 24,
              lineHeight: "24px",
              letterSpacing: "0.03em",
              color: "#FAFAFA",
            }}
          >
            {brand.title}
          </h3>
          <p
            className="line-clamp-2"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 14,
              lineHeight: "21px",
              color: "#FAFAFA",
              maxWidth: 191,
            }}
          >
            {brand.subtitle}
          </p>
        </div>
        <span
          className="inline-flex flex-col self-start border-b border-white/50 pt-1 mt-auto"
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 16,
            lineHeight: "24px",
            color: "#FFFFFF",
          }}
        >
          {t("shopNow")}
        </span>
      </div>
    </Link>
  );
}

export default function BrandsSection() {
  const t = useTranslations();
  const brands = DUMMY_BRANDS;
  const row1 = brands.slice(0, 4);
  const row2 = brands.slice(4, 8);

  return (
    <section
      className="w-full flex justify-center pt-8 pb-2"
      style={{
        paddingLeft: "clamp(16px, 9.375vw, 135px)",
        paddingRight: "clamp(16px, 9.375vw, 135px)",
      }}
    >
      <div
        className="mx-auto flex flex-col w-full"
        style={{ width: 1170, maxWidth: "100%", gap: SECTION_GAP }}
      >
        <div className="flex flex-col" style={{ gap: 20 }}>
          <div className="flex flex-row items-center" style={{ gap: 16, height: 40 }}>
            <span
              className="flex-shrink-0 rounded-[4px]"
              style={{ width: 20, height: 40, background: "#DB4444" }}
            />
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 20,
                lineHeight: "20px",
                color: "#000000",
              }}
            >
              {t("brands")}
            </span>
          </div>
        </div>

        <div className="flex flex-col w-full" style={{ gap: ROW_GAP }}>
          <div
            className="flex flex-row flex-wrap justify-center items-start"
            style={{ gap: CARD_GAP, maxWidth: 1170 }}
          >
            {row1.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
          <div
            className="flex flex-row flex-wrap justify-center items-start"
            style={{ gap: CARD_GAP, maxWidth: 1170 }}
          >
            {row2.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
