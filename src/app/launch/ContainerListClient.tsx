"use client";

import dynamic from "next/dynamic";

const ContainerList = dynamic(
  () => import("@/components/ContainerList"),
  { ssr: false }
);

export default function ContainerListClient() {
  return <ContainerList />;
}