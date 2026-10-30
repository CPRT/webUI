'use client';

import React from "react";
import { ROVER_IP, BASE_AP_900_IP, ROVER_AP_900_IP, BASE_AP_24_IP, ROVER_AP_24_IP, BASE_IP } from "@/constants"

const stats = [{
    name: "Rover M900",
    nf: -89,
    rssi: -66,
  },
  {
    name: "Ground M900",
    nf: -81,
    rssi: -33,
  },
  {
    name: "Rover M2",
    nf: -94,
    rssi: -74,
  },
  {
    name: "Ground M2",
    nf: -70,
    rssi: -45,
  },
];

const usage = {
  low: {
    bandwidth: { up: 4, down: 8 },
    throughput: { up: 1, down: 6},
  },
  high: {
    bandwidth: { up: 15, down: 20 },
    throughput: { up: 0.5, down: 13 },
  },
}

// Copy these from radio configs to match LEDs
const rssiColor: string = (rssi: number) => {
  if (rssi >= -54) return "#28a745";
  if (rssi >= -70) return "#ff8800";
  return "#dc3545";
}

const Dot: React.FC = (props) => {
  return (
    <span style={{
      width: 12,
      height: 12,
      borderRadius: "50%",
      display: "inline-block",
      backgroundColor: props.up ? "#22c55e" : "#ef4444",
      verticalAlign: "center",
    }} />
  )
}
  
const LinkStatusPanel: React.FC = () => {
  return (
    <div className="link-panel">
      <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
      <span>Mode: <span style={{ color: "#17a2b8" }}>FULL</span></span>
      <span style={{ color: "#ef4444", float: "right", paddingLeft: "20px" }}>2.4 GHz</span>
      <span style={{ color: "#22c55e", float: "right" }}>900 MHz</span>
      </div>
      <table className="ping-table">
        <thead>
          <tr>
            <th></th>
            <th colspan={3}>Ground</th>
            <th colspan={3}>Rover</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Jetson</td>
            <td>{ BASE_IP }</td>
            <td>0.100 ms</td>
            <td><Dot up={ true } /></td>
            <td>{ ROVER_IP }</td>
            <td>Offline</td>
            <td><Dot up={ false } /></td>
          </tr>
          <tr>
            <td>M900</td>
            <td>{ BASE_AP_900_IP }</td>
            <td>0.500 ms</td>
            <td><Dot up={ true } /></td>
            <td>{ ROVER_AP_900_IP }</td>
            <td>5.12 ms</td>
            <td><Dot up={ true } /></td>
          </tr>
          <tr>
            <td>M2</td>
            <td>{ BASE_AP_24_IP }</td>
            <td>0.200 ms</td>
            <td><Dot up={ true } /></td>
            <td>{ ROVER_AP_24_IP }</td>
            <td>Offline</td>
            <td><Dot up={ false } /></td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: "grid", gap: "8px 12px", gridTemplateColumns: "max-content auto max-content" , alignItems: "center" }}>
        {stats.map((radio) => (
          <>
          <span>{ radio.name }</span>
          <div className="bar-container">
            <div className="bar" style={{ background: rssiColor(radio.rssi), width: `${100 + radio.rssi}%` }}/>
            <div className="bar" style={{ background: "repeating-linear-gradient(135deg, #dc3545 0px, #dc3545 10px, #6c757d 10px, #6c757d 20px)", width: `${100 + radio.nf}%`  }} />
          </div>
          <span>{ radio.nf } dBm / { radio.rssi } dBm ({ radio.rssi - radio.nf } dBm)</span>
          </>
        ))}
      </div>
      <div style={{ display: "grid", gap: "8px 12px", gridTemplateColumns: "max-content 1fr 1fr" , alignItems: "center" }}>
        <span></span>
        <span style={{ textAlign: "center", fontWeight: 700 }}>Down</span>
        <span style={{ textAlign: "center", fontWeight: 700 }}>Up</span>
        <span>900 MHz</span>
        <div className="bar-container">
          <div className="bar" style={{ background: "#0070f3", width: `${usage.low.throughput.down / usage.low.bandwidth.down * 100}%` }}/>
          <span className="bar-label">{ usage.low.throughput.down.toFixed(2) } / { usage.low.bandwidth.down.toFixed(2) } Mbps</span>
        </div>
        <div className="bar-container">
          <div className="bar" style={{ background: "#b84dff", width: `${usage.low.throughput.up / usage.low.bandwidth.up * 100}%` }}/>
          <span className="bar-label">{ usage.low.throughput.up.toFixed(2) } / { usage.low.bandwidth.up.toFixed(2) } Mbps</span>
        </div>
        <span>2.4 GHz</span>
        <div className="bar-container">
          <div className="bar" style={{ background: "#0070f3", width: `${usage.high.throughput.down / usage.high.bandwidth.down * 100}%` }}/>
          <span className="bar-label">{ usage.high.throughput.down.toFixed(2) } / { usage.high.bandwidth.down.toFixed(2) } Mbps</span>
        </div>
        <div className="bar-container">
          <div className="bar" style={{ background: "#b84dff", width: `${usage.high.throughput.up / usage.high.bandwidth.up * 100}%` }}/>
          <span className="bar-label">{ usage.high.throughput.up.toFixed(2) } / { usage.high.bandwidth.up.toFixed(2) } Mbps</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Link</th>
            <th>Bitrate</th>
            <th>Enabled</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Primary (RTP)</td>
            <td>2.4 GHz</td>
            <td>1000 kbit/s</td>
            <td><Dot up={ true } /></td>
          </tr>
          <tr>
            <td>Mosaic (WebRTC)</td>
            <td>2.4 GHz</td>
            <td>1000 kbit/s</td>
            <td><Dot up={ false } /></td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: "flex", flexDirection: "row", gap: "6px 24px", flexWrap: "wrap" }}>
        <div>900 MHz / 2.4 GHz:</div>
        <span>CCQ - 98% / 94%</span>
        <span>TLM Packets - 1002 / 1003</span>
        <span>CMD Packets - 452 / 5</span>
        <span>Active CMD Link - 900 MHz</span>
      </div>
      <style jsx>{`
        .link-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          gap: 36px;
        }
        h3 {
          margin: 0;
          margin-bottom: 1rem;
          font-size: 1.25rem;
          text-align: center;
          border-bottom: 1px solid #444;
          padding-bottom: 0.5rem;
        }
        .bar-container {
          height: 16px;
          width: 100%;
          position: relative;
          border-radius: 8px;
          background: black;
        }
        .bar {
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 8px;
        }
        .bar-label {
          position: absolute;
          right: 8px;
          line-height: 16px;
        }
        table {
          border-collapse: collapse;
        }
        .ping-table tr th:not(:last-child) {
          border-right: 2px solid #333;
        }
        .ping-table tr td:nth-child(2), tr td:nth-child(5) {
          border-left: 2px solid #333;
          padding-left: 6px;
        }
        .ping-table tr td:nth-child(3), tr td:nth-child(6) {
          text-align: right;
          padding-right: 12px;
        }
      `}</style>
    </div>
  );
};

export default LinkStatusPanel;
