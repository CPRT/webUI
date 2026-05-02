"use client";

import React, { useEffect, useMemo, useState } from "react";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";

type RtpStatsMsg = {
  num_pushed: number; // ms
  num_lost: number; // bits/sec
  num_late: number;
  num_duplicates: number;
  avg_jitter: number;
};

const formatNumber = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return "—";
  return ms.toLocaleString();
};

const RtpStats: React.FC = () => {
  const { ros, connectionStatus } = useROS();

  const [stats, setStats] = useState<RtpStatsMsg | null>(null);
  const [lastUpdateMs, setLastUpdateMs] = useState<number | null>(null);

  useEffect(() => {
    if (!ros || connectionStatus !== "connected") {
      setStats(null);
      setLastUpdateMs(null);
      return;
    }

    const topic = new ROSLIB.Topic({
      ros,
      name: "/rtp_client_node/rtp_stats",
      messageType: "interfaces/msg/RtpStats",
    });

    const onMsg = (msg: any) => {
      const newData: RtpStatsMsg = {
        num_pushed: msg.num_pushed,
        num_lost: msg.num_lost,
        num_late: msg.num_late,
        num_duplicates: msg.num_duplicates,
        avg_jitter: msg.avg_jitter / 1000000, // convert ns to ms
      };
      setStats(newData);
      setLastUpdateMs(Date.now());
    };

    topic.subscribe(onMsg);

    return () => {
      topic.unsubscribe(onMsg);
    };
  }, [ros, connectionStatus]);

  return (
    <div
      style={{
        borderTop: "1px solid #444",
        marginTop: "0.75rem",
        paddingTop: "0.75rem",
      }}
    >
      <div
        style={{
          border: "1px solid #444",
          borderRadius: "6px",
          backgroundColor: "#2a2a2a",
          padding: "0.6rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: "1px solid #444",
            paddingBottom: "0.3rem",
            flex: "0 0 auto",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#f1f1f1" }}>
            SRT Stats:
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.5rem",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Packets Recieved</span>
            <span style={{ color: "#f1f1f1" }}>{formatNumber(stats?.num_pushed)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Packets Lost</span>
            <span style={{ color: "#f1f1f1" }}>{formatNumber(stats?.num_lost)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Packets Late</span>
            <span style={{ color: "#f1f1f1" }}>{formatNumber(stats?.num_late)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Jitter</span>
            <span style={{ color: "#f1f1f1" }}>{formatNumber(stats?.avg_jitter)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Updated</span>
            <span style={{ color: "#f1f1f1" }}>
              {lastUpdateMs ? `${Math.max(0, Date.now() - lastUpdateMs)} ms ago` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RtpStats;
