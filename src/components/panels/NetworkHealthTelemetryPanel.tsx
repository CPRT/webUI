'use client';

import React, { useEffect, useState } from "react";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";

const dotStyle = (up: boolean): React.CSSProperties => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  display: "inline-block",
  backgroundColor: up ? "#22c55e" : "#ef4444",
});

const NetworkHealthTelemetryPanel: React.FC = () => {
  const { ros } = useROS();

  const [stats, setStats] = useState({
    bandwidthTx: 0,
    bandwidthRx: 0,
    throughputTx: 0,
    throughputRx: 0,
    signalStrength: 0,
    noiseFloor: 0,
    ccqTx: 0,
  });

  const [pings, setPings] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const response = await fetch("/dashboard/api", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error(`API returned ${response.status}: ${response.statusText}`);
          return;
        }

        const data = await response.json();

        if (data.pings) {
          setPings(data.pings);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    poll();
    interval = setInterval(poll, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!ros) return;

    const bandwidthTxTopic = new ROSLIB.Topic({
      ros,
      name: "/snmp_network_stats/bandwidth_tx",
      messageType: "std_msgs/msg/Float32",
    });

    const bandwidthRxTopic = new ROSLIB.Topic({
      ros,
      name: "/snmp_network_stats/bandwidth_rx",
      messageType: "std_msgs/msg/Float32",
    });

    const throughputTxTopic = new ROSLIB.Topic({
      ros,
      name: "/snmp_network_stats/throughput_tx",
      messageType: "std_msgs/msg/Float32",
    });

    const throughputRxTopic = new ROSLIB.Topic({
      ros,
      name: "/snmp_network_stats/throughput_rx",
      messageType: "std_msgs/msg/Float32",
    });

    const signalStrengthTopic = new ROSLIB.Topic({
      ros,
      name: "/snmp_network_stats/signal_strength",
      messageType: "std_msgs/msg/Float32",
    });

    const noiseFloorTopic = new ROSLIB.Topic({
      ros,
      name: "/snmp_network_stats/noise_floor",
      messageType: "std_msgs/msg/Float32",
    });

    const ccqTxTopic = new ROSLIB.Topic({
      ros,
      name: "/snmp_network_stats/ccq_tx",
      messageType: "std_msgs/msg/Float32",
    });

    const handleBandwidthTx = (msg: ROSLIB.Message) => {
      const data = (msg as any).data as number;
      setStats((prev) => ({ ...prev, bandwidthTx: data }));
    };

    const handleBandwidthRx = (msg: ROSLIB.Message) => {
      const data = (msg as any).data as number;
      setStats((prev) => ({ ...prev, bandwidthRx: data }));
    };

    const handleThroughputTx = (msg: ROSLIB.Message) => {
      const data = (msg as any).data as number;
      setStats((prev) => ({ ...prev, throughputTx: data }));
    };

    const handleThroughputRx = (msg: ROSLIB.Message) => {
      const data = (msg as any).data as number;
      setStats((prev) => ({ ...prev, throughputRx: data }));
    };

    const handleSignalStrength = (msg: ROSLIB.Message) => {
      const data = (msg as any).data as number;
      setStats((prev) => ({ ...prev, signalStrength: data }));
    };

    const handleNoiseFloor = (msg: ROSLIB.Message) => {
      const data = (msg as any).data as number;
      setStats((prev) => ({ ...prev, noiseFloor: data }));
    };

    const handleCcqTx = (msg: ROSLIB.Message) => {
      const data = (msg as any).data as number;
      setStats((prev) => ({ ...prev, ccqTx: data }));
    };

    bandwidthTxTopic.subscribe(handleBandwidthTx);
    bandwidthRxTopic.subscribe(handleBandwidthRx);
    throughputTxTopic.subscribe(handleThroughputTx);
    throughputRxTopic.subscribe(handleThroughputRx);
    signalStrengthTopic.subscribe(handleSignalStrength);
    noiseFloorTopic.subscribe(handleNoiseFloor);
    ccqTxTopic.subscribe(handleCcqTx);

    return () => {
      bandwidthTxTopic.unsubscribe(handleBandwidthTx);
      bandwidthRxTopic.unsubscribe(handleBandwidthRx);
      throughputTxTopic.unsubscribe(handleThroughputTx);
      throughputRxTopic.unsubscribe(handleThroughputRx);
      signalStrengthTopic.unsubscribe(handleSignalStrength);
      noiseFloorTopic.unsubscribe(handleNoiseFloor);
      ccqTxTopic.unsubscribe(handleCcqTx);
    };
  }, [ros]);

  const pingRows = Object.keys(pings).map((host) => ({
    name: host,
    rttMs: pings[host] ?? 0,
    up: pings[host] !== -1 && pings[host] !== undefined,
  }));

  const toMbps = (bitsPerSecond: number) => bitsPerSecond / 1_000_000;

  const telemetryRows = [
    {
      name: "Signal Strength",
      value: stats.signalStrength.toFixed(2),
      unit: "dBm",
      good: stats.signalStrength > -70 && stats.signalStrength < -20,
    },
    {
      name: "Noise Floor",
      value: stats.noiseFloor.toFixed(2),
      unit: "dBm",
      good: stats.noiseFloor < -85,
    },
    {
      name: "CCQ TX",
      value: stats.ccqTx.toFixed(2),
      unit: "%",
      good: stats.ccqTx >= 90,
    },
    {
      name: "Downlink",
      value: `${toMbps(stats.throughputTx).toFixed(2)} / ${toMbps(
        stats.bandwidthTx
      ).toFixed(2)}`,
      unit: "Mbps",
      good:
        stats.bandwidthTx > 0 &&
        stats.throughputTx / stats.bandwidthTx < 0.8,
    },
    {
      name: "Uplink",
      value: `${toMbps(stats.throughputRx).toFixed(2)} / ${toMbps(
        stats.bandwidthRx
      ).toFixed(2)}`,
      unit: "Mbps",
      good:
        stats.bandwidthRx > 0 &&
        stats.throughputRx / stats.bandwidthRx < 0.8,
    },
  ];

  return (
    <div
      style={{
        background: "#1e1e1e",
        color: "#f1f1f1",
        padding: 0,
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginTop: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #333" }}>
                Host
              </th>
              <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid #333" }}>
                RTT (ms)
              </th>
              <th style={{ textAlign: "center", padding: "4px 8px", borderBottom: "1px solid #333" }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {pingRows.map((r) => (
              <tr key={r.name}>
                <td style={{ padding: "4px 8px", borderBottom: "1px solid #222" }}>{r.name}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #222" }}>
                  {r.rttMs === -1 ? "Offline" : r.rttMs}
                </td>
                <td style={{ padding: "4px 8px", textAlign: "center", borderBottom: "1px solid #222" }}>
                  <span style={dotStyle(r.up)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #333" }}>
                Metric
              </th>
              <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid #333" }}>
                Value
              </th>
              <th style={{ textAlign: "center", padding: "4px 8px", borderBottom: "1px solid #333" }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {telemetryRows.map((row) => (
              <tr key={row.name}>
                <td style={{ padding: "4px 8px", borderBottom: "1px solid #222" }}>{row.name}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #222" }}>
                  {row.value} {row.unit}
                </td>
                <td style={{ padding: "4px 8px", textAlign: "center", borderBottom: "1px solid #222" }}>
                  <span style={dotStyle(row.good)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NetworkHealthTelemetryPanel;