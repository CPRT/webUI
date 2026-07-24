"use client";

import Layout from '@/components/Layout';
import { Toaster } from "react-hot-toast";
import dynamic from 'next/dynamic';

const MosaicDashboard = dynamic(() => import('@/components/panels/MosaicDashboard'), { ssr: false });

const Dashboard = () => {
  return (
    <Layout>
      <MosaicDashboard />
      <Toaster />
    </Layout>
  );
};

export default Dashboard;
