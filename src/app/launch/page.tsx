import Layout from "../../components/Layout";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import ContainerListClient from "./ContainerListClient";

export const metadata: Metadata = {
  title: "Launch - CPRT webUI",
  description: "Carleton Planetary Robotics Team's ROS2 Web Interface",
};

export default function Launch() {
  return (
    <Layout>
      <ContainerListClient/>
      <Toaster />
    </Layout>
  );
}