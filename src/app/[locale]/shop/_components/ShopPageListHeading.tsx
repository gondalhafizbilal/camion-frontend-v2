"use client";

type ShopPageListHeadingProps = {
  title: string;
};

/**
 * Shop listing header (Figma: accent bar + title). Replaces breadcrumb on /shop.
 */
export default function ShopPageListHeading({ title }: ShopPageListHeadingProps) {
  return (
    <div
      className="flex min-h-10 w-full min-w-0 flex-row flex-wrap items-center"
      style={{ gap: 15.89 }}
    >
      <div
        className="shrink-0 rounded-[3.97px] bg-[#CB262E]"
        style={{ width: 19.86, height: 39.73 }}
        aria-hidden
      />
      <h1
        className="m-0 min-w-0 text-black"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 600,
          fontSize: 20,
          lineHeight: "20px",
        }}
      >
        {title}
      </h1>
    </div>
  );
}
