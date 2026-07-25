"use client";

import dynamic from "next/dynamic";

const MosaicDashboard = dynamic(
  () => import("@/components/panels/MosaicDashboard"),
  { ssr: false }
);

export default function MosaicDashboardClient() {
  return <MosaicDashboard />;
}