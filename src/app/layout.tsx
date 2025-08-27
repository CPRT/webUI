import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React from 'react';
import "./globals.css";
import { ROSProvider } from "@/ros/ROSContext";
import { WaypointProvider } from "@/contexts/WaypointContext";
import { PublicEnvProvider } from 'next-runtime-env';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOB ROS2",
  description: "Carleton Planetary Robotics Team's ROS2 Web Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <PublicEnvProvider>
          <WaypointProvider>
            <ROSProvider>
              {children}
            </ROSProvider>
          </WaypointProvider>
        </PublicEnvProvider>
      </body>
    </html>
  );
}
