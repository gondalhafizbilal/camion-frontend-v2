import { Suspense } from "react";
import Header from "@/componentsedit/layout/header/header";
import Footer from "@/componentsedit/layout/footer/footer";
import CampaignCollectionContent from "./_components/CampaignCollectionContent";

export default function CampaignCollectionPage() {
  return (
    <div className="overflow-hidden bg-white">
      <Header />
      <Suspense
        fallback={<div className="min-h-[50vh] w-full mt-16" aria-hidden />}
      >
        <CampaignCollectionContent />
      </Suspense>
      <Footer />
    </div>
  );
}
