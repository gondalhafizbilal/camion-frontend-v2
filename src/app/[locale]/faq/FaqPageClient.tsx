"use client";

import Footer from "@/componentsedit/layout/footer/footer";
import Header from "@/componentsedit/layout/header/header";
import FaqContent from "./_components/FaqContent";

export default function FaqPageClient() {
  return (
    <div id="top">
      <Header />
      <FaqContent variant="full" />
      <Footer />
    </div>
  );
}
