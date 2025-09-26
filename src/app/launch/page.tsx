'use client';

import Layout from "../../components/Layout";
import dynamic from 'next/dynamic';

const ContainerListPage = dynamic(() => import("../../components/ContainerList"), { ssr: false });

export default function Launch() {
  return (
    <Layout>
      <ContainerListPage/>
    </Layout>
  );
}

// export default ContainerPage;