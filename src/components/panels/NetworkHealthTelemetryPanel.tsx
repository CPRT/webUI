import React, { useEffect, useState } from "react";

const dotStyle = (up: boolean): React.CSSProperties => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  display: "inline-block",
  backgroundColor: up ? "#22c55e" : "#ef4444",
});

const NetworkHealthTelemetryPanel: React.FC = () => {
  const [stats, setStats] = useState({
    uplinkRttMs: 0,
    downlinkRttMs: 0,
    uplinkUp: false,
    downlinkUp: false,
  });

  const [pings, setPings] = useState<{ [key: string]: number }>({});
  const [baseStationError, setBaseStationError] = useState<string | null>(null);

  console.log('pings state:', pings);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const response = await fetch("/dashboard/api", { 
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        });
        if (!response.ok) {
          console.error(`API returned ${response.status}: ${response.statusText}`);
          return;
        }

        const data = await response.json();

        setStats({
          uplinkRttMs: data.uplinkRttMs ?? 0,
          downlinkRttMs: data.downlinkRttMs ?? 0,
          uplinkUp: Boolean(data.uplinkUp),
          downlinkUp: Boolean(data.downlinkUp),
        });
        // Set ping results for each host
        if (data.pings) {
          setPings(data.pings);
        }
        // Track base station errors
        if (data.baseStationError) {
          setBaseStationError(data.baseStationError);
        } else {
          setBaseStationError(null);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    poll();
    interval = setInterval(poll, 1000);

    return () => clearInterval(interval);
  }, []);

  const rows = [
    // Add ping results for each host
    ...Object.keys(pings).map((host) => ({

      name: host,
      rttMs: pings[host] ?? 0,
      up: pings[host] !== -1 && pings[host] !== undefined,

    })),
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
      <div style={{ marginTop: "2rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #333" }}>
                Name
              </th>
              <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #333" }}>
                RTT (ms)
              </th>
              <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #333" }}>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td style={{ padding: "8px", borderBottom: "1px solid #222" }}>{r.name}</td>
                <td style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #222" }}>
                  {r.rttMs === -1 ? "Offline" : r.rttMs}
                </td>
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #222" }}>
                  <span style={dotStyle(r.up)} />
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