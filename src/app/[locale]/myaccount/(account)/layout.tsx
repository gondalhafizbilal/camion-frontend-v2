import type { ReactNode } from "react";
import MyAccountLayoutShell from "../_components/MyAccountLayoutShell";

export default function AccountSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MyAccountLayoutShell>{children}</MyAccountLayoutShell>;
}
