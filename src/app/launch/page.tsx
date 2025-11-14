'use client';

import Layout from "../../components/Layout";
import { Toaster } from "react-hot-toast";
import dynamic from 'next/dynamic';

const ContainerListPage = dynamic(() => import("../../components/ContainerList"), { ssr: false });

export default function Launch() {
  return (
    <Layout>
      <ContainerListPage/>
      <Toaster />
    </Layout>
  );
}