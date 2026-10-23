"use client";
import Footer from "@/componentsedit/layout/footer/footer";
import Header from "@/componentsedit/layout/header/header";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { pushGtmEvent } from "@/componentsedit/analytics/gtmDataLayer";

export default function PoliciesCamionAppContent({ variant = "page" }) {
  const t = useTranslations();
  const lastUpdated = "01 January 2026";
  const isEmbedded = variant !== "page";
  const trackedPolicyViewRef = useRef(false);

  useEffect(() => {
    if (!isEmbedded && !trackedPolicyViewRef.current) {
      trackedPolicyViewRef.current = true;
      pushGtmEvent("view_return_policy", {
        source: "return_policy_page",
      });
    }
  }, [isEmbedded]);

  const toc = [
    { id: "legal-notice", label: t("policyLegalNotice") },
    { id: "terms-of-use", label: t("policyTocTerms") },
    { id: "intellectual-property", label: t("policyTocIntellectualProperty") },
    { id: "privacy-policy", label: t("policyTocPrivacy") },
    { id: "shipping-delivery", label: t("policyTocShipping") },
    { id: "return-refund", label: t("policyTocReturn") },
    {
      id: "electronic-communications",
      label: t("policyTocElectronicCommunications"),
    },
    { id: "promotions", label: t("policyTocPromotions") },
    { id: "user-content", label: t("policyTocUserContent") },
    { id: "off-platform", label: t("policyTocOffPlatform") },
    { id: "security", label: t("policyTocSecurity") },
    { id: "chargebacks", label: t("policyTocChargebacks") },
    { id: "evidence-disputes", label: t("policyTocEvidenceDisputes") },
    { id: "severability-survival", label: t("policyTocSeverabilitySurvival") },
    { id: "modifications", label: t("policyTocModifications") },
    { id: "force-majeure", label: t("policyTocForceMajeure") },
    {
      id: "platform-technology",
      label: t("policyTocPlatformTechnology"),
    },
    {
      id: "payments-third-parties",
      label: t("policyTocPaymentsThirdParties"),
    },
    {
      id: "logistics-third-parties",
      label: t("policyTocLogisticsThirdParties"),
    },
    {
      id: "no-partnership",
      label: t("policyTocNoPartnership"),
    },
    {
      id: "export-controls",
      label: t("policyTocExportControls"),
    },
    {
      id: "assignment",
      label: t("policyTocAssignment"),
    },
    {
      id: "survival-expanded",
      label: t("policyTocSurvivalExpanded"),
    },
    {
      id: "language-interpretation",
      label: t("policyTocLanguageInterpretation"),
    },
    { id: "class-action", label: t("policyTocClassAction") },
    {
      id: "dispute-escalation",
      label: t("policyTocDisputeEscalation"),
    },
    {
      id: "safe-harbor",
      label: t("policyTocSafeHarbor"),
    },
    {
      id: "business-model",
      label: t("policyTocBusinessModel"),
    },
    {
      id: "regulatory-adaptation",
      label: t("policyTocRegulatoryAdaptation"),
    },
    {
      id: "availability",
      label: t("policyTocAvailability"),
    },
    {
      id: "seller-compliance",
      label: t("policyTocSellerCompliance"),
    },
    { id: "injunctive", label: t("policyTocInjunctive") },
    { id: "entire-agreement", label: t("policyTocEntireAgreement") },
    {
      id: "consumer-law",
      label: t("policyTocConsumerLaw"),
    },
    {
      id: "currency-exchange",
      label: t("policyTocCurrencyExchange"),
    },
    {
      id: "hs-codes",
      label: t("policyTocHsCodes"),
    },
    {
      id: "beta-features",
      label: t("policyTocBetaFeatures"),
    },
    {
      id: "platform-discretion",
      label: t("policyTocPlatformDiscretion"),
    },
    {
      id: "cross-border-risk",
      label: t("policyTocCrossBorderRisk"),
    },
    {
      id: "no-duty-monitor",
      label: t("policyTocNoDutyMonitor"),
    },
    {
      id: "audit-trail",
      label: t("policyTocAuditTrail"),
    },
    {
      id: "fraud-prevention",
      label: t("policyTocFraudPrevention"),
    },
    {
      id: "third-party-dependency",
      label: t("policyTocThirdPartyDependency"),
    },
    {
      id: "government-requests",
      label: t("policyTocGovernmentRequests"),
    },
    {
      id: "tax-disclaimer",
      label: t("policyTocTaxDisclaimer"),
    },
    { id: "termination", label: t("policyTocTermination") },
    {
      id: "version-control",
      label: t("policyTocVersionControl"),
    },
    {
      id: "definitions",
      label: t("policyTocDefinitions"),
    },
    {
      id: "restricted-items",
      label: t("policyTocRestrictedItems"),
    },
    { id: "pricing-errors", label: t("policyTocPricingErrors") },
    {
      id: "returns-clarification",
      label: t("policyTocReturnsClarification"),
    },
    {
      id: "app-store",
      label: t("policyTocAppStore"),
    },
    { id: "kyc", label: t("policyTocKyc") },
    {
      id: "user-content-license",
      label: t("policyTocUserContentLicense"),
    },
    {
      id: "store-credit",
      label: t("policyTocStoreCredit"),
    },
    { id: "precedence", label: t("policyTocPrecedence") },
    { id: "severability-partial", label: t("policyTocSeverabilityPartial") },
    { id: "maximum-enforceability", label: t("policyTocMaximumEnforceability") },
    {
      id: "product-safety",
      label: t("policyTocProductSafety"),
    },
    { id: "product-recalls", label: t("policyTocProductRecalls") },
    { id: "insurance-disclaimer", label: t("policyTocInsuranceDisclaimer") },
    { id: "shipment-risk", label: t("policyTocShipmentRisk") },
    { id: "geo-blocking", label: t("policyTocGeoBlocking") },
    { id: "no-fiduciary", label: t("policyTocNoFiduciary") },
    { id: "no-advice", label: t("policyTocNoAdvice") },
    { id: "marketplace-funds", label: t("policyTocMarketplaceFunds") },
    { id: "no-guarantee-outcomes", label: t("policyTocNoGuaranteeOutcomes") },
    { id: "platform-abuse", label: t("policyTocPlatformAbuse") },
    { id: "compliance-audits", label: t("policyTocComplianceAudits") },
    { id: "third-party-integration", label: t("policyTocThirdPartyIntegration") },
    { id: "platform-independence", label: t("policyTocPlatformIndependence") },
    { id: "maximum-enforceability-final", label: t("policyTocMaximumEnforceabilityFinal") },
    { id: "health-disclaimer", label: t("policyTocHealthDisclaimer") },
    { id: "checkout-disclosure", label: t("policyTocCheckoutDisclosure") },
    { id: "contact", label: t("policyTocContact") },
  ];

  const content = (
    <main className={isEmbedded ? "text-gray-800" : "min-h-screen bg-gray-50 text-gray-800"}>
        {/* Hero */}
        {!isEmbedded && (
          <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-50/80 via-transparent to-transparent" />
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="space-y-4 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                {t("policyHeroBadge")}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                {t("policyHeroTitle")}
              </h1>
              <p className="mx-auto max-w-3xl text-base sm:text-lg text-gray-600">
                {t("policyHeroDescription")}
              </p>
              <p className="text-sm text-gray-500">{t("policyLastUpdated")}: {lastUpdated}</p>
            </div>
          </div>
          </section>
        )}

        {/* Content Grid */}
        <section className={isEmbedded ? "w-full" : "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20"}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* TOC */}
            <aside className="lg:col-span-4 xl:col-span-3 order-last lg:order-first">
              <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-900">{t("onThisPage")}</h2>
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
              </div>
            </aside>

            {/* Main content */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              <PolicyCard id="legal-notice" title={t("policyLegalNoticeTitle")}>
                <p>
                  {t("policyLegalNotice1")}
                </p>
                <p className="mt-3">
                  {t("policyLegalNotice2")}
                </p>
                <p className="mt-3">
                  {t("policyLegalNotice3")}
                </p>
                <p className="mt-3">
                  {t("policyLegalNotice4")}
                </p>
              </PolicyCard>

              <PolicyCard id="terms-of-use" title={t("policyTermsTitle")}>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_1Title")}
                </h3>
                <p className="mt-2">
                  {t("policyTerms1_1Text")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_2Title")}
                </h3>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyTerms1_2Item1")}</li>
                  <li>{t("policyTerms1_2Item2")}</li>
                </ul>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_3Title")}
                </h3>
                <p className="mt-2">
                  {t("policyTerms1_3Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyTerms1_3Item1")}</li>
                  <li>{t("policyTerms1_3Item2")}</li>
                  <li>{t("policyTerms1_3Item3")}</li>
                  <li>{t("policyTerms1_3Item4")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyTerms1_3Text2")}
                </p>
                <p className="mt-3">
                  {t("policyTerms1_3Text3")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_4Title")}
                </h3>
                <p className="mt-2">{t("policyTerms1_4Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyTerms1_4Item1")}</li>
                  <li>{t("policyTerms1_4Item2")}</li>
                  <li>{t("policyTerms1_4Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyTerms1_4Text2")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_5Title")}
                </h3>
                <p className="mt-2">
                  {t("policyTerms1_5Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyTerms1_5Item1")}</li>
                  <li>{t("policyTerms1_5Item2")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyTerms1_5Text2")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_6Title")}
                </h3>
                <p className="mt-2">
                  {t("policyTerms1_6Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyTerms1_6Item1")}</li>
                  <li>{t("policyTerms1_6Item2")}</li>
                  <li>{t("policyTerms1_6Item3")}</li>
                </ul>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_7Title")}
                </h3>
                <p className="mt-2">
                  {t("policyTerms1_7Text")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_8Title")}
                </h3>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyTerms1_8Item1")}</li>
                  <li>{t("policyTerms1_8Item2")}</li>
                  <li>{t("policyTerms1_8Item3")}</li>
                  <li>{t("policyTerms1_8Item4")}</li>
                </ul>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_9Title")}
                </h3>
                <p className="mt-2">
                  {t("policyTerms1_9Text")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_10Title")}
                </h3>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyTerms1_10Item1")}</li>
                  <li>{t("policyTerms1_10Item2")}</li>
                </ul>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_11Title")}
                </h3>
                <p className="mt-2">{t("policyTerms1_11Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyTerms1_11Item1")}</li>
                  <li>{t("policyTerms1_11Item2")}</li>
                  <li>{t("policyTerms1_11Item3")}</li>
                </ul>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyTerms1_12Title")}
                </h3>
                <p className="mt-2">
                  {t("policyTerms1_12Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="intellectual-property" title={t("policyIntellectualPropertyTitle")}>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t("policyIntellectualProperty2_1Title")}</h3>
                <p className="mt-2">
                  {t("policyIntellectualProperty2_1Text")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">{t("policyIntellectualProperty2_2Title")}</h3>
                <p className="mt-2">
                  {t("policyIntellectualProperty2_2Text")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">{t("policyIntellectualProperty2_3Title")}</h3>
                <p className="mt-2">
                  {t("policyIntellectualProperty2_3Text")}
                </p>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">{t("policyIntellectualProperty2_4Title")}</h3>
                <p className="mt-2">
                  {t("policyIntellectualProperty2_4Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="privacy-policy" title={t("policyPrivacyTitle")}>
                <p>
                  {t("policyPrivacy3Text1")}
                </p>
                <p className="mt-3">{t("policyPrivacy3Text2")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyPrivacy3Item1")}</li>
                  <li>{t("policyPrivacy3Item2")}</li>
                  <li>{t("policyPrivacy3Item3")}</li>
                  <li>{t("policyPrivacy3Item4")}</li>
                </ul>
                <p className="mt-3">{t("policyPrivacy3Text3")}</p>
              </PolicyCard>

              <PolicyCard id="shipping-delivery" title={t("policyShippingTitle")}>
                <ul className="list-disc pl-5 space-y-2">
                  <li>{t("policyShipping4Item1")}</li>
                  <li>{t("policyShipping4Item2")}</li>
                  <li>{t("policyShipping4Item3")}</li>
                  <li>
                    {t("policyShipping4Item4")}
                  </li>
                </ul>
              </PolicyCard>

              <PolicyCard id="return-refund" title={t("policyReturnTitle")}>
                <ul className="list-disc pl-5 space-y-2">
                  <li>{t("policyReturn5Item1")}</li>
                  <li>{t("policyReturn5Item2")}</li>
                  <li>{t("policyReturn5Item3")}</li>
                  <li>{t("policyReturn5Item4")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard
                id="electronic-communications"
                title={t("policyElectronicCommunicationsTitle")}
              >
                <p>{t("policyElectronicCommunications6Text1")}</p>
                <p className="mt-3">
                  {t("policyElectronicCommunications6Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="promotions" title={t("policyPromotionsTitle")}>
                <p>
                  {t("policyPromotions7Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="user-content" title={t("policyUserContentTitle")}>
                <p>
                  {t("policyUserContent8Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="off-platform" title={t("policyOffPlatformTitle")}>
                <p>
                  {t("policyOffPlatform9Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="security" title={t("policySecurityTitle")}>
                <p>
                  {t("policySecurity10Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="chargebacks" title={t("policyChargebacksTitle")}>
                <p>
                  {t("policyChargebacks11Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="evidence-disputes" title={t("policyEvidenceDisputesTitle")}>
                <p>{t("policyEvidenceDisputes12Text1")}</p>
                <p className="mt-3">
                  {t("policyEvidenceDisputes12Text2")}
                </p>

                <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
                  <p className="text-sm sm:text-base text-indigo-900 font-semibold">
                    {t("policyEvidenceDisputes12BoxTitle")}
                  </p>
                  <p className="mt-2 text-sm sm:text-base text-indigo-900">
                    {t("policyEvidenceDisputes12BoxText")}
                  </p>
                </div>
              </PolicyCard>

              <PolicyCard id="severability-survival" title={t("policySeverabilitySurvivalTitle")}>
                <p>
                  {t("policySeverabilitySurvival13Text1")}
                </p>
                <p className="mt-3">
                  {t("policySeverabilitySurvival13Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="modifications" title={t("policyModificationsTitle")}>
                <p>
                  {t("policyModifications14Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="force-majeure" title={t("policyForceMajeureTitle")}>
                <p>
                  {t("policyForceMajeure16Text1")}
                </p>
                <p className="mt-3">
                  {t("policyForceMajeure16Text2")}
                </p>
              </PolicyCard>

              <PolicyCard
                id="platform-technology"
                title={t("policyPlatformTechnologyTitle")}
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyPlatformTechnology17Title")}
                </h3>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyPlatformTechnology17Item1")}</li>
                  <li>{t("policyPlatformTechnology17Item2")}</li>
                  <li>{t("policyPlatformTechnology17Item3")}</li>
                  <li>{t("policyPlatformTechnology17Item4")}</li>
                </ul>

                <h3 className="mt-6 text-base sm:text-lg font-semibold text-gray-900">
                  {t("policyPlatformTechnology18Title")}
                </h3>
                <p className="mt-2">
                  {t("policyPlatformTechnology18Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyPlatformTechnology18Item1")}</li>
                  <li>{t("policyPlatformTechnology18Item2")}</li>
                  <li>{t("policyPlatformTechnology18Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyPlatformTechnology18Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="payments-third-parties" title={t("policyPaymentsThirdPartiesTitle")}>
                <p>
                  {t("policyPaymentsThirdParties19Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyPaymentsThirdParties19Item1")}</li>
                  <li>{t("policyPaymentsThirdParties19Item2")}</li>
                  <li>{t("policyPaymentsThirdParties19Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyPaymentsThirdParties19Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="logistics-third-parties" title={t("policyLogisticsThirdPartiesTitle")}>
                <p>
                  {t("policyLogisticsThirdParties20Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyLogisticsThirdParties20Item1")}</li>
                  <li>{t("policyLogisticsThirdParties20Item2")}</li>
                  <li>{t("policyLogisticsThirdParties20Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyLogisticsThirdParties20Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="no-partnership" title={t("policyNoPartnershipTitle")}>
                <p>
                  {t("policyNoPartnership21Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="export-controls" title={t("policyExportControlsTitle")}>
                <p>{t("policyExportControls22Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyExportControls22Item1")}</li>
                  <li>{t("policyExportControls22Item2")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyExportControls22Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="assignment" title={t("policyAssignmentTitle")}>
                <p>
                  {t("policyAssignment23Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="survival-expanded" title={t("policySurvivalExpandedTitle")}>
                <p>{t("policySurvivalExpanded24Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policySurvivalExpanded24Item1")}</li>
                  <li>{t("policySurvivalExpanded24Item2")}</li>
                  <li>{t("policySurvivalExpanded24Item3")}</li>
                  <li>{t("policySurvivalExpanded24Item4")}</li>
                  <li>{t("policySurvivalExpanded24Item5")}</li>
                  <li>{t("policySurvivalExpanded24Item6")}</li>
                  <li>{t("policySurvivalExpanded24Item7")}</li>
                  <li>{t("policySurvivalExpanded24Item8")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard id="language-interpretation" title={t("policyLanguageInterpretationTitle")}>
                <p>
                  {t("policyLanguageInterpretation25Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="class-action" title={t("policyClassActionTitle")}>
                <p>
                  {t("policyClassAction26Text1")}
                </p>
                <p className="mt-3">
                  {t("policyClassAction26Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="dispute-escalation" title={t("policyDisputeEscalationTitle")}>
                <p>
                  {t("policyDisputeEscalation27Text1")}
                </p>
                <p className="mt-3">
                  {t("policyDisputeEscalation27Text2")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyDisputeEscalation27Item1")}</li>
                  <li>{t("policyDisputeEscalation27Item2")}</li>
                  <li>{t("policyDisputeEscalation27Item3")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard id="safe-harbor" title={t("policySafeHarborTitle")}>
                <p>
                  {t("policySafeHarbor28Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="business-model" title={t("policyBusinessModelTitle")}>
                <p>{t("policyBusinessModel29Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyBusinessModel29Item1")}</li>
                  <li>{t("policyBusinessModel29Item2")}</li>
                  <li>{t("policyBusinessModel29Item3")}</li>
                  <li>{t("policyBusinessModel29Item4")}</li>
                  <li>{t("policyBusinessModel29Item5")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyBusinessModel29Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="regulatory-adaptation" title={t("policyRegulatoryAdaptationTitle")}>
                <p>
                  {t("policyRegulatoryAdaptation30Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyRegulatoryAdaptation30Item1")}</li>
                  <li>{t("policyRegulatoryAdaptation30Item2")}</li>
                  <li>{t("policyRegulatoryAdaptation30Item3")}</li>
                  <li>{t("policyRegulatoryAdaptation30Item4")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyRegulatoryAdaptation30Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="availability" title={t("policyAvailabilityTitle")}>
                <p>
                  {t("policyAvailability31Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="seller-compliance" title={t("policySellerComplianceTitle")}>
                <p>{t("policySellerCompliance32Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policySellerCompliance32Item1")}</li>
                  <li>{t("policySellerCompliance32Item2")}</li>
                  <li>{t("policySellerCompliance32Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policySellerCompliance32Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="injunctive" title={t("policyInjunctiveTitle")}>
                <p>
                  {t("policyInjunctive33Text1")}
                </p>
                <p className="mt-3">
                  {t("policyInjunctive33Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="entire-agreement" title={t("policyEntireAgreementTitle")}>
                <p>
                  {t("policyEntireAgreement35Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="consumer-law" title={t("policyConsumerLawTitle")}>
                <p>
                  {t("policyConsumerLaw36Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="currency-exchange" title={t("policyCurrencyExchangeTitle")}>
                <p>
                  {t("policyCurrencyExchange37Text1")}
                </p>
                <p className="mt-3">
                  {t("policyCurrencyExchange37Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="hs-codes" title={t("policyHsCodesTitle")}>
                <p>
                  {t("policyHsCodes38Text1")}
                </p>
                <p className="mt-3">
                  {t("policyHsCodes38Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="beta-features" title={t("policyBetaFeaturesTitle")}>
                <p>
                  {t("policyBetaFeatures39Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="platform-discretion" title={t("policyPlatformDiscretionTitle")}>
                <p>
                  {t("policyPlatformDiscretion40Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="cross-border-risk" title={t("policyCrossBorderRiskTitle")}>
                <p>
                  {t("policyCrossBorderRisk41Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyCrossBorderRisk41Item1")}</li>
                  <li>{t("policyCrossBorderRisk41Item2")}</li>
                  <li>{t("policyCrossBorderRisk41Item3")}</li>
                  <li>{t("policyCrossBorderRisk41Item4")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyCrossBorderRisk41Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="no-duty-monitor" title={t("policyNoDutyMonitorTitle")}>
                <p>{t("policyNoDutyMonitor42Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyNoDutyMonitor42Item1")}</li>
                  <li>{t("policyNoDutyMonitor42Item2")}</li>
                  <li>{t("policyNoDutyMonitor42Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyNoDutyMonitor42Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="audit-trail" title={t("policyAuditTrailTitle")}>
                <p>
                  {t("policyAuditTrail43Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="fraud-prevention" title={t("policyFraudPreventionTitle")}>
                <p>
                  {t("policyFraudPrevention44Text1")}
                </p>
                <p className="mt-3">{t("policyFraudPrevention44Text2")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyFraudPrevention44Item1")}</li>
                  <li>{t("policyFraudPrevention44Item2")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyFraudPrevention44Text3")}
                </p>
              </PolicyCard>

              <PolicyCard id="third-party-dependency" title={t("policyThirdPartyDependencyTitle")}>
                <p>
                  {t("policyThirdPartyDependency45Text1")}
                </p>
                <p className="mt-3">{t("policyThirdPartyDependency45Text2")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyThirdPartyDependency45Item1")}</li>
                  <li>{t("policyThirdPartyDependency45Item2")}</li>
                  <li>{t("policyThirdPartyDependency45Item3")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard id="government-requests" title={t("policyGovernmentRequestsTitle")}>
                <p>
                  {t("policyGovernmentRequests46Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="tax-disclaimer" title={t("policyTaxDisclaimerTitle")}>
                <p>
                  {t("policyTaxDisclaimer47Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="termination" title={t("policyTerminationTitle")}>
                <p>
                  {t("policyTermination48Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="version-control" title={t("policyVersionControlTitle")}>
                <p>{t("policyVersionControl49Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>
                    {t("policyVersionControl49Item1")}
                  </li>
                  <li>
                    {t("policyVersionControl49Item2")}
                  </li>
                </ul>
                <p className="mt-3">
                  {t("policyVersionControl49Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="definitions" title={t("policyDefinitionsTitle")}>
                <p>{t("policyDefinitions50Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>
                    <strong>{t("policyDefinitions50Term1")}</strong> {t("policyDefinitions50Def1")}
                  </li>
                  <li>
                    <strong>{t("policyDefinitions50Term2")}</strong> {t("policyDefinitions50Def2")}
                  </li>
                  <li>
                    <strong>{t("policyDefinitions50Term3")}</strong> {t("policyDefinitions50Def3")}
                  </li>
                  <li>
                    <strong>{t("policyDefinitions50Term4")}</strong> {t("policyDefinitions50Def4")}
                  </li>
                  <li>
                    <strong>{t("policyDefinitions50Term5")}</strong> {t("policyDefinitions50Def5")}
                  </li>
                  <li>
                    <strong>{t("policyDefinitions50Term6")}</strong> {t("policyDefinitions50Def6")}
                  </li>
                  <li>
                    <strong>{t("policyDefinitions50Term7")}</strong> {t("policyDefinitions50Def7")}
                  </li>
                  <li>
                    <strong>{t("policyDefinitions50Term8")}</strong> {t("policyDefinitions50Def8")}
                  </li>
                  <li>
                    <strong>{t("policyDefinitions50Term9")}</strong> {t("policyDefinitions50Def9")}
                  </li>
                </ul>
                <p className="mt-3">
                  {t("policyDefinitions50Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="restricted-items" title={t("policyRestrictedItemsTitle")}>
                <p>
                  {t("policyRestrictedItems51Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyRestrictedItems51Item1")}</li>
                  <li>{t("policyRestrictedItems51Item2")}</li>
                  <li>{t("policyRestrictedItems51Item3")}</li>
                  <li>{t("policyRestrictedItems51Item4")}</li>
                  <li>{t("policyRestrictedItems51Item5")}</li>
                  <li>{t("policyRestrictedItems51Item6")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyRestrictedItems51Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="pricing-errors" title={t("policyPricingErrorsTitle")}>
                <p>
                  {t("policyPricingErrors52Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="returns-clarification" title={t("policyReturnsClarificationTitle")}>
                <p>
                  {t("policyReturnsClarification53Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyReturnsClarification53Item1")}</li>
                  <li>{t("policyReturnsClarification53Item2")}</li>
                  <li>{t("policyReturnsClarification53Item3")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard id="app-store" title={t("policyAppStoreTitle")}>
                <p>
                  {t("policyAppStore54Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="kyc" title={t("policyKycTitle")}>
                <p>
                  {t("policyKyc55Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="user-content-license" title={t("policyUserContentLicenseTitle")}>
                <p>
                  {t("policyUserContentLicense56Text1")}
                </p>
                <p className="mt-3">{t("policyUserContentLicense56Text2")}</p>
                <p className="mt-3">{t("policyUserContentLicense56Text3")}</p>
              </PolicyCard>

              <PolicyCard id="store-credit" title={t("policyStoreCreditTitle")}>
                <p>
                  {t("policyStoreCredit57Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="precedence" title={t("policyPrecedenceTitle")}>
                <p>
                  {t("policyPrecedence58Text1")}
                </p>
                <p className="mt-3">{t("policyPrecedence58Text2")}</p>
                <ol className="mt-2 list-decimal pl-5 space-y-2">
                  <li>{t("policyPrecedence58Item1")}</li>
                  <li>{t("policyPrecedence58Item2")}</li>
                  <li>{t("policyPrecedence58Item3")}</li>
                </ol>
              </PolicyCard>

              <PolicyCard id="severability-partial" title={t("policySeverabilityPartialTitle")}>
                <p>
                  {t("policySeverabilityPartial59Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="maximum-enforceability" title={t("policyMaximumEnforceabilityTitle")}>
                <p>
                  {t("policyMaximumEnforceability60Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="product-safety" title={t("policyProductSafetyTitle")}>
                <p>
                  {t("policyProductSafety64Text1")}
                </p>
                <p className="mt-3">{t("policyProductSafety64Text2")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>
                    {t("policyProductSafety64Item1")}
                  </li>
                  <li>
                    {t("policyProductSafety64Item2")}
                  </li>
                  <li>
                    {t("policyProductSafety64Item3")}
                  </li>
                </ul>
                <p className="mt-3">{t("policyProductSafety64Text3")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyProductSafety64Item4")}</li>
                  <li>{t("policyProductSafety64Item5")}</li>
                  <li>{t("policyProductSafety64Item6")}</li>
                  <li>{t("policyProductSafety64Item7")}</li>
                  <li>{t("policyProductSafety64Item8")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyProductSafety64Text4")}
                </p>
              </PolicyCard>

              <PolicyCard id="product-recalls" title={t("policyProductRecallsTitle")}>
                <p>{t("policyProductRecalls65Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyProductRecalls65Item1")}</li>
                  <li>{t("policyProductRecalls65Item2")}</li>
                  <li>{t("policyProductRecalls65Item3")}</li>
                  <li>{t("policyProductRecalls65Item4")}</li>
                </ul>
                <p className="mt-3">{t("policyProductRecalls65Text2")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyProductRecalls65Item5")}</li>
                  <li>{t("policyProductRecalls65Item6")}</li>
                  <li>{t("policyProductRecalls65Item7")}</li>
                </ul>
                <p className="mt-3">{t("policyProductRecalls65Text3")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyProductRecalls65Item8")}</li>
                  <li>{t("policyProductRecalls65Item9")}</li>
                  <li>{t("policyProductRecalls65Item10")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyProductRecalls65Text4")}
                </p>
              </PolicyCard>

              <PolicyCard id="insurance-disclaimer" title={t("policyInsuranceDisclaimerTitle")}>
                <p>
                  {t("policyInsuranceDisclaimer66Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyInsuranceDisclaimer66Item1")}</li>
                  <li>{t("policyInsuranceDisclaimer66Item2")}</li>
                  <li>{t("policyInsuranceDisclaimer66Item3")}</li>
                  <li>{t("policyInsuranceDisclaimer66Item4")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyInsuranceDisclaimer66Text2")}
                </p>
                <p className="mt-3">{t("policyInsuranceDisclaimer66Text3")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyInsuranceDisclaimer66Item5")}</li>
                  <li>{t("policyInsuranceDisclaimer66Item6")}</li>
                  <li>{t("policyInsuranceDisclaimer66Item7")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard id="shipment-risk" title={t("policyShipmentRiskTitle")}>
                <p>{t("policyShipmentRisk67Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyShipmentRisk67Item1")}</li>
                  <li>{t("policyShipmentRisk67Item2")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyShipmentRisk67Text2")}
                </p>
                <p className="mt-3">{t("policyShipmentRisk67Text3")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyShipmentRisk67Item3")}</li>
                  <li>{t("policyShipmentRisk67Item4")}</li>
                  <li>{t("policyShipmentRisk67Item5")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard id="geo-blocking" title={t("policyGeoBlockingTitle")}>
                <p>{t("policyGeoBlocking68Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyGeoBlocking68Item1")}</li>
                  <li>{t("policyGeoBlocking68Item2")}</li>
                  <li>{t("policyGeoBlocking68Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyGeoBlocking68Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="no-fiduciary" title={t("policyNoFiduciaryTitle")}>
                <p>{t("policyNoFiduciary69Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyNoFiduciary69Item1")}</li>
                  <li>{t("policyNoFiduciary69Item2")}</li>
                  <li>{t("policyNoFiduciary69Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyNoFiduciary69Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="no-advice" title={t("policyNoAdviceTitle")}>
                <p>
                  {t("policyNoAdvice70Text1")}
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyNoAdvice70Item1")}</li>
                  <li>{t("policyNoAdvice70Item2")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyNoAdvice70Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="marketplace-funds" title={t("policyMarketplaceFundsTitle")}>
                <p>
                  {t("policyMarketplaceFunds71Text1")}
                </p>
                <p className="mt-3">{t("policyMarketplaceFunds71Text2")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyMarketplaceFunds71Item1")}</li>
                  <li>{t("policyMarketplaceFunds71Item2")}</li>
                </ul>
                <p className="mt-3">{t("policyMarketplaceFunds71Text3")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyMarketplaceFunds71Item3")}</li>
                  <li>{t("policyMarketplaceFunds71Item4")}</li>
                  <li>{t("policyMarketplaceFunds71Item5")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard id="no-guarantee-outcomes" title={t("policyNoGuaranteeOutcomesTitle")}>
                <p>{t("policyNoGuaranteeOutcomes72Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyNoGuaranteeOutcomes72Item1")}</li>
                  <li>{t("policyNoGuaranteeOutcomes72Item2")}</li>
                  <li>{t("policyNoGuaranteeOutcomes72Item3")}</li>
                  <li>{t("policyNoGuaranteeOutcomes72Item4")}</li>
                  <li>{t("policyNoGuaranteeOutcomes72Item5")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyNoGuaranteeOutcomes72Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="platform-abuse" title={t("policyPlatformAbuseTitle")}>
                <p>{t("policyPlatformAbuse73Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyPlatformAbuse73Item1")}</li>
                  <li>{t("policyPlatformAbuse73Item2")}</li>
                  <li>{t("policyPlatformAbuse73Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyPlatformAbuse73Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="compliance-audits" title={t("policyComplianceAuditsTitle")}>
                <p>{t("policyComplianceAudits74Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyComplianceAudits74Item1")}</li>
                  <li>{t("policyComplianceAudits74Item2")}</li>
                  <li>{t("policyComplianceAudits74Item3")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyComplianceAudits74Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="third-party-integration" title={t("policyThirdPartyIntegrationTitle")}>
                <p>
                  {t("policyThirdPartyIntegration75Text1")}
                </p>
                <p className="mt-3">{t("policyThirdPartyIntegration75Text2")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyThirdPartyIntegration75Item1")}</li>
                  <li>{t("policyThirdPartyIntegration75Item2")}</li>
                  <li>{t("policyThirdPartyIntegration75Item3")}</li>
                </ul>
              </PolicyCard>

              <PolicyCard id="platform-independence" title={t("policyPlatformIndependenceTitle")}>
                <p>{t("policyPlatformIndependence76Text1")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyPlatformIndependence76Item1")}</li>
                  <li>{t("policyPlatformIndependence76Item2")}</li>
                  <li>{t("policyPlatformIndependence76Item3")}</li>
                  <li>{t("policyPlatformIndependence76Item4")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyPlatformIndependence76Text2")}
                </p>
              </PolicyCard>

              <PolicyCard id="maximum-enforceability-final" title={t("policyMaximumEnforceabilityFinalTitle")}>
                <p>
                  {t("policyMaximumEnforceabilityFinal77Text")}
                </p>
              </PolicyCard>

              <PolicyCard id="health-disclaimer" title={t("policyHealthDisclaimerTitle")}>
                <p>
                  {t("policyHealthDisclaimerText1")}
                </p>
                <p className="mt-3">{t("policyHealthDisclaimerText2")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyHealthDisclaimerItem1")}</li>
                  <li>{t("policyHealthDisclaimerItem2")}</li>
                  <li>{t("policyHealthDisclaimerItem3")}</li>
                </ul>
                <p className="mt-3">{t("policyHealthDisclaimerText3")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>{t("policyHealthDisclaimerItem4")}</li>
                  <li>{t("policyHealthDisclaimerItem5")}</li>
                  <li>{t("policyHealthDisclaimerItem6")}</li>
                </ul>
                <p className="mt-3">
                  {t("policyHealthDisclaimerText4")}
                </p>
              </PolicyCard>

              <PolicyCard id="checkout-disclosure" title={t("policyCheckoutDisclosureTitle")}>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm sm:text-base text-amber-900 font-semibold">
                    {t("policyCheckoutDisclosureText")}
                  </p>
                </div>
              </PolicyCard>

              <PolicyCard id="contact" title={t("policyContactTitle")}>
                <p className="font-semibold">{t("policyContact15Company")}</p>
                <p className="mt-2">{t("policyContact15Location")}</p>
                <p className="mt-2">
                  {t("policyContact15EmailLabel")}: <a href="mailto:support@camiontrading.com" className="text-indigo-600 hover:text-indigo-800">support@camiontrading.com</a>
                </p>
                <p className="mt-2">
                  {t("policyContact15PhoneLabel")}: <a href="tel:+97472112233" className="text-indigo-600 hover:text-indigo-800">+974 7211 2233</a>
                </p>
              </PolicyCard>
            </div>
          </div>
        </section>
      </main>
  );

  if (isEmbedded) {
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
            {t("privacyPolicies") || "Privacy Policies"}
          </h1>
          <p className="text-sm text-gray-500">
            {t("policyLastUpdated")}: {lastUpdated}
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div id="top">
      <Header />
      {content}
      <Footer />
    </div>
  );
}

function PolicyCard({ id, title, children }) {
  return (
    <div id={id} className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="prose prose-sm sm:prose-base max-w-none text-gray-700">{children}</div>
    </div>
  );
}
