import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
const NetworkHealthTelemetryPanel: React.FC = () => {
  const [stats, setStats] = useState({
    uplinkThroughput: 0,
    downlinkThroughput: 0,
    uplinkCapacity: 100,
    downlinkCapacity: 100,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Polling function to fetch data from the API route
    const poll = async () => {
      try {
        const response = await fetch("/dashboard/api", {
          method: "GET",
        });
        if (!response.ok) {
          console.error("Failed to fetch status from API route");
          return;
        }
        const data = await response.json();

        const uplinkCapacity = data.uplinkCapacity ?? 0;
        const downlinkCapacity = data.downlinkCapacity ?? 0;
        const uplinkThroughput = data.uplinkThroughput?? 0;
        const downlinkThroughput = data.downlinkThroughput ?? 0;

        setStats({
          uplinkThroughput,
          downlinkThroughput,
          uplinkCapacity,
          downlinkCapacity,
        });
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Initial poll + start interval
    poll();
    interval = setInterval(poll, 1000);

    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // rounded throughput kbps / 10 to get 2 decimal places, then divided by 100 to finish conversion to Mbps
  const data = [
    {
      name: "Uplink",
      Throughput: Math.round(stats.uplinkThroughput / 10) / 100,
      Capacity: stats.uplinkCapacity / 1000,
    },
    {
      name: "Downlink",
      Throughput: Math.round(stats.downlinkThroughput / 10) / 100,
      Capacity: stats.downlinkCapacity / 1000,
    },
  ];

  return (
    <div
      style={{
        background: "#1e1e1e",
        color: "#f1f1f1",
        padding: "1rem",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          margin: "0",
          marginBottom: "1rem",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "1.25rem",
          textAlign: "center",
          borderBottom: "1px solid #444",
          paddingBottom: "0.5rem",
        }}
      >
        Connection Health (Mbps)
      </h3>

      <div style={{ marginTop: "2rem", height: "250px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis
              type="number"
              domain={[0, (dataMax:number) => Math.floor(dataMax * 1.2)]}
              stroke="#ccc"
              tick={{ fill: "#ccc" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#ccc"
              tick={{ fill: "#ccc" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#333", border: "none", color: "#fff" }}
              labelStyle={{ color: "#ddd" }}
            />
            <Bar dataKey="Capacity" fill="#4b5563" barSize={24} />
            <Bar dataKey="Throughput" fill="#3b82f6" barSize={16}>
              <LabelList dataKey="Throughput" position="right" fill="#f1f1f1" />
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.Throughput / entry.Capacity > 0.85
                      ? "#ef4444"
                      : "#3b82f6"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NetworkHealthTelemetryPanel;