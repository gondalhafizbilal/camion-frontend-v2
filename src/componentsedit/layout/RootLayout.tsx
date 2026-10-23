"use client";

import type { ReactNode } from "react";
//import TopPromoBar from "./header/TopPromoBar";
//import SecondaryTopBar from "./header/SecondaryTopBar";
// import MainHeaderLayout from "./header/MainHeaderLayout";
import Header from "./header/header";
import Footer from "./footer/footer";

type RootLayoutProps = {
  children: ReactNode;
  variant?: "auth";
};

export default function RootLayout({ children, variant }: RootLayoutProps) {
  const isAuth = variant === "auth";
  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-white">
      {!isAuth && (
        <div
          className="absolute left-0 w-full pointer-events-none z-[120]"
          style={{
            top: 120,
            height: 0,
            opacity: 0.3,
            borderTop: "0.5px solid #000000",
          }}
          aria-hidden
        />
      )}
      <header className="w-full flex-shrink-0 bg-white relative z-[130]">
        <Header />
      </header>
      <main
        id="main-content"
        className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden"
      >
        {isAuth && (
          <div
            className="w-full flex-shrink-0 border-t border-black/30"
            style={{ borderTopWidth: "0.5px" }}
            aria-hidden
          />
        )}
        <div className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
