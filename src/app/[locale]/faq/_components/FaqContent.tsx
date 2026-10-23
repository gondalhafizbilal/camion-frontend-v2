"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden="true"
    className={`transition-transform ${open ? "rotate-180" : ""}`}
    fill="currentColor"
  >
    <path d="M12 15.5 5.5 9l1.4-1.4L12 12.7l5.1-5.1L18.5 9 12 15.5Z" />
  </svg>
);

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function FAQCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FAQItem({
  q,
  children,
  isOpen,
  onToggle,
}: {
  q: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left",
          "transition",
          "hover:bg-gray-50",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
        )}
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base font-semibold text-gray-900">
          {q}
        </span>
        <span className="text-indigo-600 shrink-0">
          <Chevron open={isOpen} />
        </span>
      </button>

      <div
        className={cn(
          "px-4 sm:px-5 pb-4 text-gray-700",
          isOpen ? "block" : "hidden",
        )}
      >
        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}

type TFn = ReturnType<typeof useTranslations>;

function FaqNumberedSteps({
  t,
  stepPrefix,
  steps,
  introKey,
  outroKey,
  outro2Key,
}: {
  t: TFn;
  stepPrefix: string;
  steps: number;
  introKey?: Parameters<TFn>[0];
  outroKey?: Parameters<TFn>[0];
  outro2Key?: Parameters<TFn>[0];
}) {
  return (
    <>
      {introKey ? <p>{t(introKey)}</p> : null}
      <ol className="mt-2 list-decimal pl-5 space-y-2">
        {Array.from({ length: steps }, (_, index) => (
          <li key={index}>
            {t(`${stepPrefix}Step${index + 1}` as Parameters<TFn>[0])}
          </li>
        ))}
      </ol>
      {outroKey ? <p className="mt-3">{t(outroKey)}</p> : null}
      {outro2Key ? <p className="mt-3">{t(outro2Key)}</p> : null}
    </>
  );
}

function FaqBulletList({
  t,
  itemPrefix,
  items,
  introKey,
  listIntroKey,
  outroKey,
  textKey,
}: {
  t: TFn;
  itemPrefix: string;
  items: number;
  introKey?: Parameters<TFn>[0];
  listIntroKey?: Parameters<TFn>[0];
  outroKey?: Parameters<TFn>[0];
  textKey?: Parameters<TFn>[0];
}) {
  return (
    <>
      {textKey ? <p>{t(textKey)}</p> : null}
      {introKey ? <p className={textKey ? "mt-3" : undefined}>{t(introKey)}</p> : null}
      {listIntroKey ? <p className="mt-3">{t(listIntroKey)}</p> : null}
      <ul className="mt-2 list-disc pl-5 space-y-2">
        {Array.from({ length: items }, (_, index) => (
          <li key={index}>
            {t(`${itemPrefix}Item${index + 1}` as Parameters<TFn>[0])}
          </li>
        ))}
      </ul>
      {outroKey ? <p className="mt-3">{t(outroKey)}</p> : null}
    </>
  );
}

function buildFaqAnswer(
  t: TFn,
  sectionId: string,
  n: number,
  aKey: Parameters<TFn>[0],
): ReactNode {
  if (sectionId === "account") {
    switch (n) {
      case 6:
        return (
          <FaqBulletList
            t={t}
            itemPrefix="faqAccountA6"
            items={5}
            introKey="faqAccountA6Intro"
            outroKey="faqAccountA6Outro"
          />
        );
      case 7:
        return (
          <FaqNumberedSteps
            t={t}
            stepPrefix="faqAccountA7"
            steps={6}
            introKey="faqAccountA7Intro"
            outroKey="faqAccountA7Outro"
          />
        );
      case 8:
        return (
          <FaqNumberedSteps
            t={t}
            stepPrefix="faqAccountA8"
            steps={6}
            introKey="faqAccountA8Intro"
            outroKey="faqAccountA8Outro"
          />
        );
      case 9:
        return (
          <FaqNumberedSteps
            t={t}
            stepPrefix="faqAccountA9"
            steps={6}
            introKey="faqAccountA9Intro"
            outroKey="faqAccountA9Outro"
          />
        );
      case 10:
        return (
          <FaqNumberedSteps
            t={t}
            stepPrefix="faqAccountA10"
            steps={3}
            introKey="faqAccountA10Intro"
          />
        );
      case 11:
        return (
          <FaqNumberedSteps
            t={t}
            stepPrefix="faqAccountA11"
            steps={4}
            introKey="faqAccountA11Intro"
            outroKey="faqAccountA11Outro"
          />
        );
      case 12:
        return (
          <FaqNumberedSteps
            t={t}
            stepPrefix="faqAccountA12"
            steps={5}
            introKey="faqAccountA12Intro"
            outroKey="faqAccountA12Outro"
            outro2Key="faqAccountA12Outro2"
          />
        );
      case 13:
        return (
          <FaqBulletList
            t={t}
            itemPrefix="faqAccountA13"
            items={7}
            introKey="faqAccountA13Intro"
            outroKey="faqAccountA13Outro"
          />
        );
      default:
        break;
    }
  }

  if (sectionId === "security") {
    if (n === 1) {
      return (
        <FaqBulletList
          t={t}
          itemPrefix="faqSecurityA1"
          items={4}
          textKey="faqSecurityA1Text1"
          introKey="faqSecurityA1Intro"
          outroKey="faqSecurityA1Outro"
        />
      );
    }
    if (n === 2) {
      return (
        <FaqBulletList
          t={t}
          itemPrefix="faqSecurityA2"
          items={5}
          introKey="faqSecurityA2Intro"
          outroKey="faqSecurityA2Outro"
        />
      );
    }
    if (n === 3) {
      return (
        <FaqBulletList
          t={t}
          itemPrefix="faqSecurityA3"
          items={5}
          introKey="faqSecurityA3Intro"
          outroKey="faqSecurityA3Outro"
        />
      );
    }
  }

  return <p>{t(aKey)}</p>;
}

type FaqVariant = "full" | "account";

export default function FaqContent({ variant = "full" }: { variant?: FaqVariant }) {
  const t = useTranslations();
  const lastUpdated = "21 July 2026";
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = (key: string) =>
    setOpenKey(openKey === key ? null : key);

  const sections = useMemo(
    () => [
      {
        id: "orders",
        title: t("faqCategoryOrders"),
        count: 12,
        prefix: "faqOrders",
      },
      {
        id: "shipping",
        title: t("faqCategoryShipping"),
        count: 13,
        prefix: "faqShipping",
      },
      {
        id: "payments",
        title: t("faqCategoryPayment"),
        count: 6,
        prefix: "faqPayment",
      },
      {
        id: "returns",
        title: t("faqCategoryReturns"),
        count: 6,
        prefix: "faqReturns",
      },
      {
        id: "products",
        title: t("faqCategoryProducts"),
        count: 6,
        prefix: "faqProduct",
      },
      {
        id: "protection",
        title: t("faqCategoryProtection"),
        count: 9,
        prefix: "faqProtection",
      },
      {
        id: "account",
        title: t("faqCategoryAccount"),
        count: 13,
        prefix: "faqAccount",
      },
      {
        id: "security",
        title: t("faqCategorySecurity"),
        count: 3,
        prefix: "faqSecurity",
      },
      {
        id: "promotions",
        title: t("faqCategoryPromotions"),
        count: 7,
        prefix: "faqPromo",
      },
      {
        id: "trust",
        title: t("faqCategoryTrust"),
        count: 4,
        prefix: "faqTrust",
      },
      {
        id: "consolidated",
        title: t("faqCategoryConsolidated"),
        count: 4,
        prefix: "faqConsolidated",
      },
      {
        id: "quality",
        title: t("faqCategoryQuality"),
        count: 5,
        prefix: "faqQuality",
      },
      {
        id: "support",
        title: t("faqCategorySupport"),
        count: 5,
        prefix: "faqSupport",
      },
      {
        id: "report",
        title: t("faqCategoryReport"),
        count: 4,
        prefix: "faqReport",
      },
      {
        id: "track",
        title: t("faqCategoryTrack"),
        count: 5,
        prefix: "faqTrack",
      },
    ].map((section) => ({
      id: section.id,
      title: section.title,
      items: Array.from({ length: section.count }, (_, index) => {
        const n = index + 1;
        const qKey = `${section.prefix}Q${n}` as Parameters<typeof t>[0];
        const aKey = `${section.prefix}A${n}` as Parameters<typeof t>[0];

        return {
          q: t(qKey),
          a: buildFaqAnswer(t, section.id, n, aKey),
        };
      }),
    })),
    [t],
  );

  const toc = useMemo(
    () => sections.map((s) => ({ id: s.id, label: s.title })),
    [sections],
  );

  if (variant === "account") {
    return (
      <div
        className="w-full"
        style={{
          background: "#FFFFFF",
          boxShadow: "0px 1px 13px rgba(0, 0, 0, 0.05)",
          borderRadius: 4,
          padding: "40px clamp(24px, 5vw, 80px)",
        }}
      >
        <div className="space-y-2 mb-6">
          <h1
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 20,
              lineHeight: "28px",
              color: "#DB4444",
            }}
          >
            {t("help") || "Help"}
          </h1>
          <p className="text-sm text-gray-500">
            {t("policyLastUpdated")}: {lastUpdated}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <aside className="lg:col-span-4 xl:col-span-3 order-last lg:order-first">
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900">
                {t("onThisPage")}
              </h2>
              <nav className="mt-3 space-y-2 text-sm">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-indigo-700 transition"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm text-indigo-900">{t("faqPolicyHint")}</p>
                <Link
                  href="/myaccount/privacy-policies"
                  className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition"
                >
                  {t("faqViewFullPolicies")} →
                </Link>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {sections.map((section) => (
              <FAQCard key={section.id} id={section.id} title={section.title}>
                {section.items.map((item, idx) => {
                  const key = `${section.id}-${idx}`;
                  const isOpen = openKey === key;
                  return (
                    <FAQItem
                      key={key}
                      q={item.q}
                      isOpen={isOpen}
                      onToggle={() => toggle(key)}
                    >
                      {item.a}
                    </FAQItem>
                  );
                })}
              </FAQCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-50/80 via-transparent to-transparent" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="space-y-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              {t("faqHeroBadge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              {t("frequentlyAskedQuestions")}
            </h1>
            <p className="mx-auto max-w-3xl text-base sm:text-lg text-gray-600">
              {t("faqHeroDescription")}
            </p>
            <p className="text-sm text-gray-500">
              {t("policyLastUpdated")}: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <aside className="lg:col-span-4 xl:col-span-3 order-last lg:order-first">
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900">
                {t("onThisPage")}
              </h2>
              <nav className="mt-3 space-y-2 text-sm">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-indigo-700 transition"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm text-indigo-900">{t("faqPolicyHint")}</p>
                <Link
                  href="/PoliciesCamionApp"
                  className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition"
                >
                  {t("faqViewFullPolicies")} →
                </Link>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {sections.map((section) => (
              <FAQCard key={section.id} id={section.id} title={section.title}>
                {section.items.map((item, idx) => {
                  const key = `${section.id}-${idx}`;
                  const isOpen = openKey === key;
                  return (
                    <FAQItem
                      key={key}
                      q={item.q}
                      isOpen={isOpen}
                      onToggle={() => toggle(key)}
                    >
                      {item.a}
                    </FAQItem>
                  );
                })}
              </FAQCard>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
