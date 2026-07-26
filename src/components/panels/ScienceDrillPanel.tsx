'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";

const MOTOR1_TOPIC = "/elevator/status";
const MOTOR2_TOPIC = "/drill/status";
const TALON_MSG_TYPE = "ros_phoenix/msg/MotorStatus";

const CM_PER_REVOLUTION = 1.5;
const POSITION_DIRECTION = 1; // flip if height should go the other way
const MAX_DRILL_TRAVEL_CM = 100; // what should we set this to?

const SAMPLE_INTERVAL_MS = 250;
const MAX_POINTS = 120; // ~30s of history at the sample interval above

interface TalonStatus {
  temperature: number;
  bus_voltage: number;
  output_percent: number;
  output_voltage: number;
  output_current: number;
  position: number;
  velocity: number;
  fwd_limit: boolean;
  rev_limit: boolean;
  active_errors: number;
}

const EMPTY_STATUS: TalonStatus = {
  temperature: 0,
  bus_voltage: 0,
  output_percent: 0,
  output_voltage: 0,
  output_current: 0,
  position: 0,
  velocity: 0,
  fwd_limit: false,
  rev_limit: false,
  active_errors: 0,
};
// copied from the message 
const ERROR_FLAGS: [number, string][] = [
  [1, "INITIALIZING"],
  [2, "SYSTEM_LEVEL"],
  [4, "TIMING_ERROR"],
  [8, "MISSING_ESTIMATE"],
  [16, "BAD_CONFIG"],
  [32, "DRV_FAULT"],
  [64, "MISSING_INPUT"],
  [256, "DC_BUS_OVER_VOLTAGE"],
  [512, "DC_BUS_UNDER_VOLTAGE"],
  [1024, "DC_BUS_OVER_CURRENT"],
  [2048, "DC_BUS_OVER_REGEN_CURRENT"],
  [4096, "CURRENT_LIMIT_VIOLATION"],
  [8192, "MOTOR_OVER_TEMP"],
  [16384, "INVERTER_OVER_TEMP"],
  [32768, "VELOCITY_LIMIT_VIOLATION"],
  [65536, "POSITION_LIMIT_VIOLATION"],
  [131072, "REQUESTED_CURRENT_TOO_HIGH"],
  [16777216, "WATCHDOG_TIMER_EXPIRED"],
  [33554432, "ESTOP_REQUESTED"],
  [67108864, "SPINOUT_DETECTED"],
  [134217728, "BRAKE_RESISTOR_DISARMED"],
  [268435456, "THERMISTOR_DISCONNECTED"],
  [1073741824, "CALIBRATION_ERROR"],
];

function getActiveErrorNames(mask: number): string[] {
  return ERROR_FLAGS.filter(([bit]) => (mask & bit) !== 0).map(([, name]) => name);
}

const dotStyle = (up: boolean): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  display: "inline-block",
  backgroundColor: up ? "#22c55e" : "#ef4444",
});

// for reading msg and keeping the graph clean
function useSeriesBuffer() {
  const [data, setData] = useState<number[]>([]);
  const lastSampleRef = useRef(0);

  const push = useCallback((value: number) => {
    const now = Date.now();
    if (now - lastSampleRef.current < SAMPLE_INTERVAL_MS) return;
    lastSampleRef.current = now;
    setData((prev) => {
      const next = prev.length >= MAX_POINTS ? prev.slice(1) : prev.slice();
      next.push(value);
      return next;
    });
  }, []);

  return [data, push] as const;
}

const Sparkline: React.FC<{
  data: number[];
  color: string;
  unit: string;
  height?: number;
}> = ({ data, color, unit, height = 56 }) => {
  const width = 300;

  if (data.length < 2) {
    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        <text x={width / 2} y={height / 2} fill="#666" fontSize={10} textAnchor="middle">
          collecting data…
        </text>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const last = data[data.length - 1];

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "#888",
          marginTop: 2,
        }}
      >
        <span>min {min.toFixed(2)}</span>
        <span style={{ color, fontWeight: 600 }}>
          {last.toFixed(2)} {unit}
        </span>
        <span>max {max.toFixed(2)}</span>
      </div>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; color: string; unit: string; data: number[] }> = ({
  title,
  color,
  unit,
  data,
}) => (
  <div style={{ padding: "8px 10px", border: "1px solid #2a2a2a", borderRadius: 6 }}>
    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {title}
    </div>
    <Sparkline data={data} color={color} unit={unit} />
  </div>
);

const RawDataTable: React.FC<{ status: TalonStatus }> = ({ status }) => {
  const errors = getActiveErrorNames(status.active_errors);
  const rows: [string, string][] = [
    ["Temperature", `${status.temperature.toFixed(2)} °C`],
    ["Bus Voltage", `${status.bus_voltage.toFixed(2)} V`],
    ["Output %", `${status.output_percent.toFixed(2)} %`],
    ["Output Voltage", `${status.output_voltage.toFixed(2)} V`],
    ["Output Current", `${status.output_current.toFixed(2)} A`],
    ["Position", `${status.position.toFixed(4)} rev`],
    ["Velocity", `${status.velocity.toFixed(4)} rev/s`],
    ["Fwd Limit", status.fwd_limit ? "TRIGGERED" : "clear"],
    ["Rev Limit", status.rev_limit ? "TRIGGERED" : "clear"],
    ["Active Errors (raw)", String(status.active_errors)],
  ];

  return (
    <div style={{ marginTop: 8, background: "#161616", borderRadius: 6, padding: "6px 8px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: "3px 6px", color: "#999" }}>{label}</td>
              <td style={{ padding: "3px 6px", textAlign: "right", fontFamily: "monospace" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Decoded errors:</div>
        {errors.length === 0 ? (
          <span style={{ fontSize: 12, color: "#22c55e" }}>none</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {errors.map((e) => (
              <span
                key={e}
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#ef4444",
                  border: "1px solid #ef4444",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ToggleButton: React.FC<{ shown: boolean; onClick: () => void }> = ({ shown, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: shown ? "#333" : "#222",
      color: "#ddd",
      border: "1px solid #3a3a3a",
      borderRadius: 5,
      padding: "3px 10px",
      fontSize: 11,
      cursor: "pointer",
    }}
  >
    {shown ? "Hide raw data" : "Show raw data"}
  </button>
);

// ----------------------------------------------------------------------------------
// Main panel
// ----------------------------------------------------------------------------------
const DrillMotorTelemetryPanel: React.FC = () => {
  const { ros } = useROS();

  const [motor1, setMotor1] = useState<TalonStatus>(EMPTY_STATUS);
  const [motor2, setMotor2] = useState<TalonStatus>(EMPTY_STATUS);

  const [motor1RawShown, setMotor1RawShown] = useState(false);
  const [motor2RawShown, setMotor2RawShown] = useState(false);

  // Height tracking: local offset applied on top of raw encoder position.
  // NOTE: this only resets the *displayed* height in the browser — it does not
  // zero anything on the Talon/encoder itself. If you want the reset to persist
  // across page reloads or be visible to other clients, wire this button to a
  // ROS service/topic instead of local state.
  const [positionOffset, setPositionOffset] = useState(0);

  const [m1Current, pushM1Current] = useSeriesBuffer();
  const [m1Velocity, pushM1Velocity] = useSeriesBuffer();

  const [m2Current, pushM2Current] = useSeriesBuffer();
  const [m2Velocity, pushM2Velocity] = useSeriesBuffer();
  const [m2Temperature, pushM2Temperature] = useSeriesBuffer();

  useEffect(() => {
    if (!ros) return;

    const motor1Topic = new ROSLIB.Topic({
      ros,
      name: MOTOR1_TOPIC,
      messageType: TALON_MSG_TYPE,
    });

    const motor2Topic = new ROSLIB.Topic({
      ros,
      name: MOTOR2_TOPIC,
      messageType: TALON_MSG_TYPE,
    });

    const handleMotor1 = (msg: ROSLIB.Message) => {
      const data = msg as unknown as TalonStatus;
      setMotor1(data);
      pushM1Current(data.output_current);
      pushM1Velocity(data.velocity);
    };

    const handleMotor2 = (msg: ROSLIB.Message) => {
      const data = msg as unknown as TalonStatus;
      setMotor2(data);
      pushM2Current(data.output_current);
      pushM2Velocity(data.velocity);
      pushM2Temperature(data.temperature);
    };

    motor1Topic.subscribe(handleMotor1);
    motor2Topic.subscribe(handleMotor2);

    return () => {
      motor1Topic.unsubscribe(handleMotor1);
      motor2Topic.unsubscribe(handleMotor2);
    };
  }, [ros, pushM1Current, pushM1Velocity, pushM2Current, pushM2Velocity, pushM2Temperature]);

  const heightCm = (motor1.position - positionOffset) * CM_PER_REVOLUTION * POSITION_DIRECTION;
  const heightPct = Math.min(100, Math.max(0, (heightCm / MAX_DRILL_TRAVEL_CM) * 100));

  const handleResetHeight = () => {
    setPositionOffset(motor1.position);
  };

  return (
    <div
      style={{
        background: "#1e1e1e",
        color: "#f1f1f1",
        padding: 12,
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* ---------------- MOTOR 1 : DRILL LOWERING ---------------- */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", color: "#ccc" }}>
            Motor 1 — Drill Lower/Raise
          </h3>
          <ToggleButton shown={motor1RawShown} onClick={() => setMotor1RawShown((s) => !s)} />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* height gauge + reset */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              border: "1px solid #2a2a2a",
              borderRadius: 6,
              minWidth: 90,
            }}
          >
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase" }}>Drill Depth</div>
            <div
              style={{
                width: 22,
                height: 90,
                border: "1px solid #3a3a3a",
                borderRadius: 4,
                position: "relative",
                background: "#141414",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${heightPct}%`,
                  background: heightPct > 90 ? "#ef4444" : "#3b82f6",
                  transition: "height 0.2s ease",
                }}
              />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{heightCm.toFixed(2)} cm</div>
            <button
              onClick={handleResetHeight}
              style={{
                background: "#2a2a2a",
                color: "#ddd",
                border: "1px solid #3a3a3a",
                borderRadius: 5,
                padding: "4px 8px",
                fontSize: 11,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              title="Zero the displayed depth at the current position (call when drill tip is at the top)"
            >
              Reset height (zero at top)
            </button>
            <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#999" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={dotStyle(!motor1.fwd_limit)} /> fwd limit
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={dotStyle(!motor1.rev_limit)} /> rev limit
              </span>
            </div>
          </div>

          {/* current + velocity graphs */}
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 8 }}>
            <ChartCard title="Output Current" color="#f59e0b" unit="A" data={m1Current} />
            <ChartCard title="Velocity" color="#3b82f6" unit="rev/s" data={m1Velocity} />
          </div>
        </div>

        {motor1RawShown && <RawDataTable status={motor1} />}
      </section>

      {/* ---------------- MOTOR 2 : DRILL SPIN ---------------- */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", color: "#ccc" }}>
            Motor 2 — Drill Spin
          </h3>
          <ToggleButton shown={motor2RawShown} onClick={() => setMotor2RawShown((s) => !s)} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ChartCard title="Output Current" color="#f59e0b" unit="A" data={m2Current} />
          <ChartCard title="Velocity" color="#3b82f6" unit="rev/s" data={m2Velocity} />
          <ChartCard title="Temperature" color="#ef4444" unit="°C" data={m2Temperature} />
        </div>

        {motor2RawShown && <RawDataTable status={motor2} />}
      </section>
    </div>
  );
};

export default DrillMotorTelemetryPanel;
