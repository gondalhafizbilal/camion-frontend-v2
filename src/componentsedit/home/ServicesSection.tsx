"use client";

import { useTranslations } from "next-intl";
import Image from "@/componentsedit/StaticImage";
import { HOME_SECTION_X_PADDING_CLASS } from "@/componentsedit/home/homeSectionLayout";

const montserrat = { fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif" };

/**
 * Icon wrapper: 80x80 with Ellipse 6 (full, #CB262E opacity 0.3) and
 * Ellipse 5 (13.75% inset = 72.5% size, #CB262E). Icon 40x40 centered (25% inset).
 */
function ServiceIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0 rounded-full w-16 h-16 lg:w-20 lg:h-20"
    >
      {/* Ellipse 6: full size, #CB262E opacity 0.3 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "#CB262E", opacity: 0.3 }}
        aria-hidden
      />
      {/* Ellipse 5: 13.75% inset = 72.5% of 80 = 58px */}
      <div
        className="absolute rounded-full"
        style={{
          left: "13.75%",
          right: "13.75%",
          top: "13.75%",
          bottom: "13.75%",
          background: "#CB262E",
        }}
        aria-hidden
      />
      {/* Icon: 25% inset = 50% of 80 = 40px at lg */}
      <div className="relative flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10">
        <Image
          src={src}
          alt={alt}
          width={40}
          height={40}
          className="object-contain size-8 lg:size-10"
        />
      </div>
    </div>
  );
}

const SERVICES = [
  {
    id: "delivery",
    icon: "/assets/icons/icon-delivery.svg",
    titleKey: "servicesFreeDelivery",
    descKey: "servicesFreeDeliveryDesc",
  },
  {
    id: "customer-service",
    icon: "/assets/icons/icon-customer-service.svg",
    titleKey: "servicesCustomerService",
    descKey: "servicesCustomerServiceDesc",
  },
  {
    id: "secure",
    icon: "/assets/icons/icon-secure.svg",
    titleKey: "servicesMoneyBack",
    descKey: "servicesMoneyBackDesc",
  },
];

export default function ServicesSection() {
  const t = useTranslations();

  return (
    <section
      className={`w-full flex justify-center items-center py-8 sm:py-10 md:py-12 ${HOME_SECTION_X_PADDING_CLASS}`}
    >
      <div
        className="flex flex-col items-stretch gap-10 w-full max-w-[1056px] lg:flex-row lg:flex-nowrap lg:justify-center lg:items-start lg:gap-16 xl:gap-[120px]"
      >
        {SERVICES.map((service) => (
          <div
            key={service.id}
            className="flex flex-col items-center shrink-0 gap-4 sm:gap-5 lg:gap-6 w-full max-w-[274px] mx-auto lg:mx-0 lg:w-auto lg:max-w-none"
          >
            <ServiceIcon src={service.icon} alt={t(service.titleKey)} />
            <div className="flex flex-col items-center gap-2 w-full">
              <h3
                className="text-center text-[#000000] font-semibold text-lg leading-7 lg:whitespace-nowrap lg:text-xl lg:leading-7"
                style={{
                  ...montserrat,
                }}
              >
                {t(service.titleKey)}
              </h3>
              <p
                className="text-center text-[#000000] text-sm leading-relaxed max-w-[274px] mx-auto lg:max-w-none lg:whitespace-nowrap"
                style={{
                  ...montserrat,
                  fontWeight: 400,
                }}
              >
                {t(service.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
