"use client";

import { useParams } from "next/navigation";
import TrackOrderPanel from "@/app/[locale]/track/_components/TrackOrderPanel";

export default function AccountOrderTrackPage() {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const orderUuid = id ? String(id) : null;

  return (
    <section
      className="w-full"
      style={{
        background: "#FFFFFF",
        boxShadow: "0px 1px 13px rgba(0, 0, 0, 0.05)",
        borderRadius: 4,
        minHeight: 400,
        padding: "40px clamp(16px, 4vw, 80px)",
      }}
    >
      <TrackOrderPanel orderUuid={orderUuid} />
    </section>
  );
}
