import Layout from '@/components/Layout';
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import MosaicDashboardClient from "./MosaicDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard - CPRT webUI",
  description: "Carleton Planetary Robotics Team's ROS2 Web Interface",
};

export default function Dashboard() {
  return (
    <Layout>
      <MosaicDashboardClient />
      <Toaster />
    </Layout>
  );
}
