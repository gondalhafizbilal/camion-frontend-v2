"use client";

import { HOME_CONTENT_INNER_CLASS, HOME_SECTION_X_PADDING_CLASS } from "@/componentsedit/home/homeSectionLayout";

export default function SectionDividerLine() {
  return (
    <section
      className={`w-full flex justify-center pt-5 pb-0 lg:pt-8 ${HOME_SECTION_X_PADDING_CLASS}`}
    >
      <div
        className={`${HOME_CONTENT_INNER_CLASS} h-0 opacity-30 border-t border-black`}
        style={{ borderTopWidth: "0.5px" }}
      />
    </section>
  );
}
