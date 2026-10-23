"use client";

import { Fragment, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

const textStyle: CSSProperties = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: 14,
  lineHeight: "21px",
  color: "#000000",
};

export type RoadmapItem = {
  label: string;
  href?: string;
};

function Roadmap({ items = [] }: { items?: RoadmapItem[] }) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (!items.length) return null;

  const separatorStyle: CSSProperties = {
    width: 13.19,
    height: 0,
    opacity: 0.5,
    border: "1px solid #000000",
    transform: isRtl ? "rotate(-117.05deg)" : "rotate(117.05deg)",
    flex: "none",
  };

  return (
    <nav
      className="flex flex-row items-center flex-wrap"
      style={{ padding: 0, gap: 12 }}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isLink = !!item.href && !isLast;
        const opacity = isLast ? 1 : 0.5;

        return (
          <Fragment key={index}>
            {index > 0 && <span style={separatorStyle} aria-hidden />}
            {isLink ? (
              <Link
                href={item.href!}
                className="hover:opacity-80 transition-opacity"
                style={{ ...textStyle, opacity, flex: "none" }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ ...textStyle, opacity, flex: "none" }}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default Roadmap;
