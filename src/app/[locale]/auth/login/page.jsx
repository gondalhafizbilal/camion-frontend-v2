"use client";

import RootLayout from "@/componentsedit/layout/RootLayout";
import LoginCenterContent from "./_components/LoginCenterContent";

export default function LoginPage() {
  return (
    <RootLayout variant="auth">
      <LoginCenterContent />
    </RootLayout>
  );
}
