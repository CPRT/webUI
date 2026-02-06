"use client";

import React, { useEffect, useMemo, useState } from "react";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";

type SrtStatsMsg = {
  rtt: number; // ms
  bandwidth: number; // bits/sec
  packets_sent: number;
  packets_lost: number;
  packets_retransmitted: number;
  packet_dropped_total: number;
};

const formatNumber = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return "—";
  return ms.toLocaleString();
};

const formatSecondsMs = (sec: number | null | undefined) => {
  if (sec === null || sec === undefined) return "—";
  const ms = sec * 1000.0;
  if (!Number.isFinite(ms)) return "—";
  return ms >= 10 ? `${ms.toFixed(0)} ms` : `${ms.toFixed(1)} ms`;
};

const formatBandwidth = (bps: number | null | undefined) => {
  if (bps === null || bps === undefined) return "—";
  if (!Number.isFinite(bps)) return "—";
  const abs = Math.abs(bps);
  const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
  let i = 0;
  let val = abs;
  while (val >= 1000 && i < units.length - 1) {
    val /= 1000;
    i++;
  }
  const fixed = val >= 100 ? 0 : val >= 10 ? 1 : 2;
  return `${val.toFixed(fixed)} ${units[i]}`;
};

const SrtStats: React.FC = () => {
  const { ros, connectionStatus } = useROS();

  const [stats, setStats] = useState<SrtStatsMsg | null>(null);
  const [lastUpdateMs, setLastUpdateMs] = useState<number | null>(null);

  useEffect(() => {
    if (!ros || connectionStatus !== "connected") {
      setStats(null);
      setLastUpdateMs(null);
      return;
    }

    const topic = new ROSLIB.Topic({
      ros,
      name: "/srt_node/stats",
      messageType: "interfaces/msg/SrtStats",
    });

    const onMsg = (msg: any) => {
      const newData: SrtStatsMsg = {
        rtt: msg.rtt,
        bandwidth: msg.bandwidth,
        packets_sent: msg.packets_sent,
        packets_lost: msg.packets_lost,
        packets_retransmitted: msg.packets_retransmitted,
        packet_dropped_total: msg.packet_dropped_total || 0,
      };
      setStats(newData);
      setLastUpdateMs(Date.now());
    };

    topic.subscribe(onMsg);

    return () => {
      topic.unsubscribe(onMsg);
    };
  }, [ros, connectionStatus]);

  const derived = useMemo(() => {
    if (!stats) return { lossPct: null as number | null, retransPct: null as number | null };

    const sent = stats.packets_sent;
    const lost = stats.packets_lost;
    const retrans = stats.packets_retransmitted;

    const lossPct =
      Number.isFinite(sent) && sent > 0 && Number.isFinite(lost) ? (lost / sent) * 100 : null;

    const retransPct =
      Number.isFinite(sent) && sent > 0 && Number.isFinite(retrans) ? (retrans / sent) * 100 : null;

    return { lossPct, retransPct };
  }, [stats]);

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
            <span style={{ color: "#aaa" }}>RTT</span>
            <span style={{ color: "#f1f1f1" }}>{formatSecondsMs(stats?.rtt)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Bandwidth</span>
            <span style={{ color: "#f1f1f1" }}>{formatBandwidth(stats?.bandwidth)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Sent</span>
            <span style={{ color: "#f1f1f1" }}>{formatNumber(stats?.packets_sent)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Lost</span>
            <span style={{ color: "#f1f1f1" }}>
              {formatNumber(stats?.packets_lost)}
              {derived.lossPct !== null ? ` (${derived.lossPct.toFixed(2)}%)` : ""}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Drops</span>
            <span style={{ color: "#f1f1f1" }}>{formatNumber(stats?.packet_dropped_total)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#aaa" }}>Retrans</span>
            <span style={{ color: "#f1f1f1" }}>
              {formatNumber(stats?.packets_retransmitted)}
              {derived.retransPct !== null ? ` (${derived.retransPct.toFixed(2)}%)` : ""}
            </span>
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

export default SrtStats;
