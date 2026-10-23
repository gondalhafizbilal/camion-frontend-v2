"use client";

import RootLayout from "@/componentsedit/layout/RootLayout";
import ContactCenterContent from "./_components/ContactCenterContent";
import ZendeskWidgetLoader from "./_components/ZendeskWidgetLoader";

export default function ContactPageClient() {
  return (
    <RootLayout>
      <ZendeskWidgetLoader snippetKey="98a52833-c995-4304-be86-a272a44f17c5" />
      <ContactCenterContent />
    </RootLayout>
  );
}
