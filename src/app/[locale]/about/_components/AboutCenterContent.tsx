"use client";

import Image from "@/componentsedit/StaticImage";
import { useTranslations } from "next-intl";
import ServicesSection from "@/componentsedit/home/ServicesSection";
import { PAGE_CONTENT_INNER_CLASS } from "@/lib/layout/pageContentLayout";

const statCardShell =
  "relative flex min-h-[220px] w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-[4px] border border-black/30 bg-white px-3 py-6 sm:min-h-[240px] sm:px-4 sm:py-7 xl:min-h-[280px] xl:px-5 xl:py-8";

const statValueClass =
  "w-full font-sans text-center text-xl font-semibold leading-tight tracking-[0.02em] sm:text-2xl sm:leading-8 xl:text-[26px]";

const statLabelClass =
  "w-full font-sans text-center text-xs font-normal leading-snug break-words [text-wrap:balance] sm:text-sm sm:leading-5 xl:text-[15px] xl:leading-[22px]";

function StatCardText({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  const tone = highlight ? "text-white" : "text-black";
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2 text-center">
      <div className={`${statValueClass} ${tone}`}>{value}</div>
      <div className={`${statLabelClass} ${tone}`}>{label}</div>
    </div>
  );
}

function SellersStatCard() {
  const t = useTranslations();
  return (
    <div className={statCardShell}>
      <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:gap-4">
        <svg
          className="h-14 w-14 shrink-0 sm:h-16 sm:w-16 xl:h-[72px] xl:w-[72px]"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path opacity="0.3" d="M80 40C80 62.0914 62.0914 80 40 80C17.9086 80 0 62.0914 0 40C0 17.9086 17.9086 0 40 0C62.0914 0 80 17.9086 80 40ZM10.9071 40C10.9071 56.0675 23.9325 69.0929 40 69.0929C56.0675 69.0929 69.0929 56.0675 69.0929 40C69.0929 23.9325 56.0675 10.9071 40 10.9071C23.9325 10.9071 10.9071 23.9325 10.9071 40Z" fill="#CB262E"/>
          <circle cx="40" cy="40" r="29" fill="#CB262E"/>
          <path d="M54.1416 25H47.4883L48.3216 33.3333C48.3216 33.3333 49.9883 35 52.4883 35C53.8006 35.0017 55.0684 34.524 56.0533 33.6567C56.1574 33.5594 56.235 33.4372 56.2787 33.3016C56.3224 33.166 56.3309 33.0214 56.3033 32.8817L55.1266 25.8333C55.0873 25.6005 54.9668 25.3891 54.7865 25.2366C54.6062 25.084 54.3778 25.0002 54.1416 25V25Z" stroke="white" strokeWidth="2"/>
          <path d="M47.4883 25L48.3216 33.3333C48.3216 33.3333 46.6549 35 44.1549 35C41.6549 35 39.9883 33.3333 39.9883 33.3333V25H47.4883Z" stroke="#FAFAFA" strokeWidth="2"/>
          <path d="M39.9896 25V33.3333C39.9896 33.3333 38.3229 35 35.8229 35C33.3229 35 31.6562 33.3333 31.6562 33.3333L32.4896 25H39.9896Z" stroke="#FAFAFA" strokeWidth="2"/>
          <path d="M32.4892 25H25.8376C25.6009 24.9999 25.3719 25.0838 25.1912 25.2367C25.0105 25.3896 24.89 25.6016 24.8509 25.835L23.6759 32.8833C23.6485 33.0231 23.657 33.1676 23.7007 33.3032C23.7445 33.4387 23.8219 33.5609 23.9259 33.6583C24.4726 34.1417 25.6942 35.0017 27.4892 35.0017C29.9892 35.0017 31.6559 33.335 31.6559 33.335L32.4892 25.0017V25Z" stroke="#FAFAFA" strokeWidth="2"/>
          <path d="M25 35V51.6667C25 52.5507 25.3512 53.3986 25.9763 54.0237C26.6014 54.6488 27.4493 55 28.3333 55H51.6667C52.5507 55 53.3986 54.6488 54.0237 54.0237C54.6488 53.3986 55 52.5507 55 51.6667V35" stroke="#FAFAFA" strokeWidth="2"/>
          <path d="M44.7227 55V45C44.7227 44.1159 44.3715 43.2681 43.7463 42.6429C43.1212 42.0178 42.2734 41.6666 41.3893 41.6666H38.056C37.1719 41.6666 36.3241 42.0178 35.699 42.6429C35.0738 43.2681 34.7227 44.1159 34.7227 45V55" stroke="#FAFAFA" strokeWidth="2" strokeMiterlimit="16"/>
        </svg>

        <StatCardText
          value={t("aboutSellersValue")}
          label={t("aboutSellersLabel")}
        />
      </div>
    </div>
  );
}

const monthlyCardShell = (highlight: boolean) =>
  `relative flex min-h-[220px] w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-[4px] px-3 py-6 sm:min-h-[240px] sm:px-4 sm:py-7 xl:min-h-[280px] xl:px-5 xl:py-8 ${
    highlight
      ? "bg-[#CB262E] shadow-[0px_2px_10px_2px_rgba(0,0,0,0.2)]"
      : "border border-black/30 bg-white"
  }`;

function MonthlySalesStatCard() {
  const t = useTranslations();
  const highlight = true;
  return (
    <div className={monthlyCardShell(highlight)}>
      <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16 xl:h-[72px] xl:w-[72px] ${
            highlight ? "bg-white/20" : "bg-black/5"
          }`}
        >
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-9 h-9 sm:w-10 sm:h-10 ${highlight ? "text-white" : "text-black"}`}
            aria-hidden
          >
            <path
              d="M19.9993 37.2728C29.5388 37.2728 37.272 29.5395 37.272 20C37.272 10.4606 29.5388 2.72729 19.9993 2.72729C10.4598 2.72729 2.72656 10.4606 2.72656 20C2.72656 29.5395 10.4598 37.2728 19.9993 37.2728Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M25.0904 14.547C24.761 13.9758 24.2825 13.505 23.706 13.1848C23.1295 12.8646 22.4768 12.7072 21.8176 12.7294H18.1813C17.2169 12.7294 16.2919 13.1124 15.61 13.7941C14.928 14.4759 14.5449 15.4005 14.5449 16.3647C14.5449 17.3288 14.928 18.2535 15.61 18.9353C16.2919 19.617 17.2169 20 18.1813 20H21.8176C22.7821 20 23.707 20.383 24.3889 21.0648C25.0709 21.7465 25.454 22.6712 25.454 23.6354C25.454 24.5995 25.0709 25.5242 24.3889 26.2059C23.707 26.8877 22.7821 27.2707 21.8176 27.2707H18.1813C17.5222 27.2929 16.8694 27.1354 16.293 26.8153C15.7165 26.4951 15.2379 26.0242 14.9086 25.453"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 8.18176V12.1212M20 27.8787V31.8181"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <StatCardText
          value={t("aboutMonthlySaleValue")}
          label={t("aboutMonthlySaleLabel")}
          highlight={highlight}
        />
      </div>
    </div>
  );
}

function CustomersStatCard() {
  const t = useTranslations();
  return (
    <div className={statCardShell}>
      <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16 xl:h-[72px] xl:w-[72px]">
          <div className="absolute inset-0 rounded-full" style={{ background: "#CB262E", opacity: 0.3 }} aria-hidden />
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
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path
                d="M11.666 11.6667V8.33339C11.666 7.36818 11.9454 6.42362 12.4705 5.6137C12.9955 4.80379 13.7437 4.16315 14.6248 3.76912C15.5059 3.37509 16.4823 3.24451 17.436 3.39313C18.3896 3.54176 19.2799 3.96325 19.9993 4.60672C20.7188 3.96325 21.6091 3.54176 22.5627 3.39313C23.5164 3.24451 24.4928 3.37509 25.3739 3.76912C26.255 4.16315 27.0032 4.80379 27.5282 5.6137C28.0533 6.42362 28.3327 7.36818 28.3327 8.33339V11.6667H30.8327C31.4957 11.6667 32.1316 11.9301 32.6004 12.399C33.0693 12.8678 33.3327 13.5037 33.3327 14.1667V30.8417C33.3327 32.3866 32.719 33.8682 31.6266 34.9606C30.5342 36.053 29.0526 36.6667 27.5077 36.6667H13.3327C11.5646 36.6667 9.86888 35.9643 8.61864 34.7141C7.36839 33.4639 6.66602 31.7682 6.66602 30.0001V14.1667C6.66602 13.5037 6.92941 12.8678 7.39825 12.399C7.86709 11.9301 8.50297 11.6667 9.16602 11.6667H11.666ZM22.7244 34.1667C22.0445 33.1914 21.6808 32.0306 21.6827 30.8417V14.1667H9.16602V30.0001C9.16602 30.5472 9.27379 31.089 9.48318 31.5946C9.69258 32.1001 9.99949 32.5594 10.3864 32.9463C10.7733 33.3332 11.2326 33.6402 11.7382 33.8496C12.2437 34.0589 12.7855 34.1667 13.3327 34.1667H22.7244ZM19.166 11.6667V8.33339C19.166 7.67035 18.9026 7.03446 18.4338 6.56562C17.9649 6.09678 17.3291 5.83339 16.666 5.83339C16.003 5.83339 15.3671 6.09678 14.8982 6.56562C14.4294 7.03446 14.166 7.67035 14.166 8.33339V11.6667H19.166ZM21.666 11.6667H25.8327V8.33339C25.8327 7.81878 25.674 7.31669 25.3781 6.89566C25.0822 6.47463 24.6636 6.15517 24.1794 5.98089C23.6952 5.8066 23.169 5.78599 22.6726 5.92186C22.1763 6.05773 21.7339 6.34346 21.406 6.74005C21.5743 7.24005 21.666 7.77672 21.666 8.33339V11.6667ZM24.1827 30.8417C24.1827 31.7236 24.533 32.5693 25.1566 33.1929C25.7801 33.8164 26.6258 34.1667 27.5077 34.1667C28.3895 34.1667 29.2353 33.8164 29.8588 33.1929C30.4824 32.5693 30.8327 31.7236 30.8327 30.8417V14.1667H24.1827V30.8417Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        <StatCardText
          value={t("aboutCustomersValue")}
          label={t("aboutCustomersLabel")}
        />
      </div>
    </div>
  );
}

function AnnualSalesStatCard() {
  const t = useTranslations();
  return (
    <div className={statCardShell}>
      <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16 xl:h-[72px] xl:w-[72px]">
          <div className="absolute inset-0 rounded-full" style={{ background: "#CB262E", opacity: 0.3 }} aria-hidden />
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
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path
                d="M20.4268 29.7731H20.9268C21.5511 29.7731 22.1503 29.5251 22.5918 29.0836C23.0333 28.6421 23.2812 28.0429 23.2812 27.4186C23.2812 26.7942 23.0333 26.1951 22.5918 25.7535C22.1502 25.312 21.5512 25.0641 20.9268 25.0641H20.4268V29.7731ZM19.0723 19.5006C18.4478 19.5006 17.8488 19.7485 17.4072 20.1901C16.9658 20.6316 16.7178 21.2308 16.7178 21.8551C16.7179 22.4793 16.966 23.0777 17.4072 23.5192C17.8488 23.9607 18.4478 24.2096 19.0723 24.2096H19.5723V19.5006H19.0723ZM19.5723 25.0641H19.0723C18.2212 25.0641 17.4045 24.7255 16.8027 24.1237C16.2012 23.522 15.8634 22.7059 15.8633 21.8551C15.8633 21.0041 16.2011 20.1874 16.8027 19.5856C17.4045 18.9838 18.2212 18.6461 19.0723 18.6461H19.5723V17.7184H20.4268V18.6461H20.9268C21.5905 18.6461 22.2383 18.8518 22.7803 19.235C23.2542 19.5702 23.6273 20.0265 23.8613 20.5543L23.9531 20.7858C23.9716 20.8384 23.9795 20.8941 23.9766 20.9498C23.9736 21.0059 23.9598 21.0613 23.9355 21.1119C23.9113 21.1625 23.8776 21.2083 23.8359 21.2457C23.7942 21.2832 23.7452 21.312 23.6924 21.3307C23.6395 21.3494 23.5834 21.3571 23.5273 21.3541C23.4715 21.3511 23.4167 21.3372 23.3662 21.3131C23.2641 21.2643 23.1852 21.1767 23.1475 21.0699C22.9851 20.6109 22.6838 20.2133 22.2861 19.9323C21.8885 19.6512 21.4137 19.5005 20.9268 19.5006H20.4268V24.2096H20.9268C21.7778 24.2096 22.5945 24.5472 23.1963 25.149C23.798 25.7509 24.1357 26.5675 24.1357 27.4186C24.1357 28.2694 23.7979 29.0854 23.1963 29.6871C22.5945 30.2889 21.7778 30.6276 20.9268 30.6276H20.4268V31.5543H19.5723V30.6276H19.0723C18.4085 30.6275 17.7607 30.4219 17.2188 30.0387C16.6769 29.6556 16.2672 29.1135 16.0459 28.4879L16.041 28.4742C16.0205 28.421 16.0109 28.3642 16.0127 28.3073C16.0145 28.2502 16.0279 28.194 16.0518 28.1422C16.0757 28.0903 16.1101 28.044 16.1523 28.0055C16.1946 27.967 16.244 27.9366 16.2979 27.9176C16.3516 27.8987 16.4089 27.8907 16.4658 27.8942C16.5228 27.8976 16.5788 27.9128 16.6299 27.9381C16.6809 27.9634 16.7265 27.9985 16.7637 28.0416C16.801 28.0849 16.8292 28.1357 16.8467 28.1901L16.8486 28.1969L16.8516 28.2037C17.1761 29.1184 18.0474 29.773 19.0723 29.7731H19.5723V25.0641Z"
                fill="#FAFAFA"
                stroke="#FAFAFA"
              />
              <path
                d="M20.0361 3.80945C23.9382 3.80945 27.4978 5.04277 29.7168 6.12L29.8447 6.1825C30.284 6.39987 30.6638 6.60847 30.9766 6.7948L27.8457 11.3729L27.6143 11.7108L27.9014 12.0048C29.8396 13.9864 31.6698 16.5169 32.9805 19.1923C34.2934 21.8724 35.0683 24.6627 34.9414 27.1737C34.8155 29.6638 33.8056 31.8866 31.5166 33.5038C29.2054 35.1366 25.538 36.1884 20.0361 36.1884C14.5332 36.1883 10.8546 35.1548 8.52832 33.5438C6.22488 31.9487 5.19876 29.7545 5.05762 27.286C4.9153 24.7955 5.67566 22.0153 6.9834 19.3202C8.28876 16.63 10.1227 14.0594 12.0811 11.9989L12.3594 11.7069L12.1328 11.3739L9.02246 6.79675C9.17967 6.70416 9.35379 6.60749 9.54297 6.50671L9.54492 6.50574C9.7354 6.40331 9.94076 6.29779 10.1611 6.19031L10.2197 6.16199C12.4563 5.07592 16.0841 3.8095 20.0361 3.80945ZM26.957 12.6981C22.6083 14.3798 17.3703 14.38 13.0215 12.7001L12.8418 13.1659L12.4756 12.826C10.6577 14.7855 8.96568 17.1901 7.75098 19.6932C6.55983 22.149 5.86865 24.6147 5.89551 26.8036L5.91016 27.2372C6.0376 29.4718 6.94935 31.4116 9.0127 32.8417C11.1392 34.3136 14.6197 35.3338 20.0352 35.3339C25.4465 35.3339 28.9126 34.2956 31.0215 32.8055C33.0713 31.3568 33.9725 29.3909 34.0869 27.1298C34.2038 24.8131 33.4877 22.1697 32.2119 19.5673L32.2109 19.5653L31.9766 19.1044C30.7861 16.8113 29.2793 14.6958 27.5 12.8202L27.2695 12.577L26.957 12.6981ZM28.7627 7.08093C26.4933 7.24436 23.8596 7.72976 21.2637 8.4198L20.1553 8.72742C18.2952 9.26476 16.2165 9.22705 14.2295 8.90027L13.834 8.83093C13.3047 8.7328 12.7788 8.6166 12.2578 8.48132L10.9727 8.14734L11.7188 9.24597L13.499 11.8671L13.5908 12.0028L13.7451 12.0575C17.6692 13.4545 22.2998 13.4545 26.2246 12.0594L26.0566 11.5878L26.4697 11.87L29.2119 7.86218L29.7969 7.00671L28.7627 7.08093ZM20.0352 4.66394C16.7535 4.66399 13.7063 5.5779 11.5801 6.48035L11.7754 6.94031L11.6328 7.4198C12.3895 7.64493 13.1819 7.84098 13.9873 7.99011H13.9883C16.0232 8.3649 18.1082 8.43009 19.917 7.90613L19.918 7.90515C21.8862 7.33179 23.8882 6.88147 25.9121 6.55554L25.9766 5.58289C24.2351 5.05858 22.1902 4.66394 20.0352 4.66394Z"
                fill="#FAFAFA"
                stroke="#FAFAFA"
              />
            </svg>
          </div>
        </div>

        <StatCardText
          value={t("aboutAnnualGrossValue")}
          label={t("aboutAnnualGrossLabel")}
        />
      </div>
    </div>
  );
}

const OUR_STORY_PARAGRAPH_KEYS = [
  "ourStoryP1",
  "ourStoryP2",
  "ourStoryP3",
  "ourStoryP4",
] as const;

export default function AboutCenterContent() {
  const t = useTranslations();

  return (
    <>
      <section className="w-full overflow-x-hidden px-4 md:px-10">
        <div className={`${PAGE_CONTENT_INNER_CLASS} pt-4 pb-10 sm:pt-6 sm:pb-12 xl:pt-6 xl:pb-12`}>
          <div className="flex flex-col gap-8 md:gap-10 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
            <div className="flex min-w-0 flex-col gap-5 sm:gap-6 md:gap-8 xl:max-w-[525px] xl:flex-shrink-0">
              <h1 className="font-sans font-semibold text-black text-left text-[32px] leading-[38px] sm:text-[40px] sm:leading-[48px] md:text-[44px] md:leading-[52px] xl:text-[54px] xl:leading-[64px] xl:text-justify">
                {t("ourStory")}
              </h1>
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
                {OUR_STORY_PARAGRAPH_KEYS.map((key) => (
                  <p
                    key={key}
                    className="font-sans font-normal text-[15px] leading-[24px] sm:text-base sm:leading-[26px] text-black"
                  >
                    {t(key)}
                  </p>
                ))}
              </div>
            </div>

            <div className="relative w-full shrink-0 overflow-hidden rounded-[4px] bg-[#EB7EA8] aspect-[705/609] min-h-[200px] max-h-[360px] sm:max-h-[420px] md:max-h-[480px] xl:h-[609px] xl:w-[705px] xl:max-h-none xl:rounded-l-[4px] xl:rounded-r-none">
              <Image
                src="/assets/images/Side-Image.png"
                alt="About"
                fill
                className="object-cover"
                sizes="(max-width: 1279px) 100vw, 705px"
                unoptimized
                priority={false}
              />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:mt-14 md:gap-5 xl:mt-16 xl:grid-cols-4 xl:gap-[30px]">
            <SellersStatCard />
            <MonthlySalesStatCard />
            <CustomersStatCard />
            <AnnualSalesStatCard />
          </div>
        </div>
      </section>

      <ServicesSection />
    </>
  );
}
