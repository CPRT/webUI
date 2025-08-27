"use client";

import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';

const MosaicDashboard = dynamic(() => import('@/components/panels/MosaicDashboard'), { ssr: false });

const Dashboard = () => {
  return (
    <Layout>
      <MosaicDashboard />
    </Layout>
  );
};

export default Dashboard;
