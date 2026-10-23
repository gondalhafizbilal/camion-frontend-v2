"use client";

import RootLayout from "@/componentsedit/layout/RootLayout";
import WishlistCenterContent from "./_components/WishlistCenterContent";
import YouMayAlsoLikeSection from "../shop/[slug]/_components/YouMayAlsoLikeSection";
import { PAGE_CONTENT_INNER_CLASS } from "@/lib/layout/pageContentLayout";

export default function WishlistPage() {
  return (
    <RootLayout>
      <div className="flex w-full min-w-0 flex-col items-stretch overflow-x-hidden pt-8 pb-12 md:pt-10 md:pb-16 lg:pt-[60px] lg:pb-20">
        <div className="w-full min-w-0 px-4 md:px-8">
          <WishlistCenterContent />
        </div>
        <div className="mt-10 flex w-full min-w-0 justify-center px-4 md:mt-12 md:px-8 lg:mt-14">
          <div className={PAGE_CONTENT_INNER_CLASS}>
            <YouMayAlsoLikeSection />
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
