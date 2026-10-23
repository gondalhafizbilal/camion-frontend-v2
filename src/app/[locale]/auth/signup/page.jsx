"use client";

import RootLayout from "@/componentsedit/layout/RootLayout";
import SignupCenterContent from "./_components/SignupCenterContent";

export default function SignupPage() {
  return (
    <RootLayout variant="auth">
      <SignupCenterContent />
    </RootLayout>
  );
}
