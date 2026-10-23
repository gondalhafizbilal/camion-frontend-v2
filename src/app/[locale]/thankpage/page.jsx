import Footer from "@/componentsedit/layout/footer/footer";
import Header from "@/componentsedit/layout/header/header";
import { Link } from "@/i18n/navigation";
import React from "react";
import Image from "@/componentsedit/StaticImage";

function ThankPage() {
  return (
    <div>
      <Header />
      <main className="w-[95%] p-4 justify-center items-center m-auto bg-white rounded-2xl flex flex-col md:w-[40%] mx-auto mt-10">
        <Image
          src="/assets/images/check 3.svg"
          alt="Order completed checkmark"
          width={104}
          height={104}
          className="w-26 h-26 rounded-full"
        />
        <div className="flex  items-center justify-center gap-4 mt-4">
          <Link
            href="/order"
            className="text-[#B92123] border border-[#B92123] rounded-lg py-2 px-6 font-semibold"
          >
            مشاهدة الطلب
          </Link>
          <Link
            href="/shop"
            className="text-[#B92123] border border-[#B92123] rounded-lg py-2 px-6 font-semibold"
          >
            متابعة التسوق
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ThankPage;
