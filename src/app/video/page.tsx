'use client';

import Layout from "../../components/Layout";
import dynamic from 'next/dynamic';

const GstWebRTCPage = dynamic(() => import("../../components/WebRTCClientPage"), { ssr: false });

export default function Video() {
  return (
    <Layout>
      <GstWebRTCPage/>
    </Layout>
  );
}

// export default video;