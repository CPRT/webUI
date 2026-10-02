'use client';

import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import html2canvas from 'html2canvas';
import { useROS } from '@/ros/ROSContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_AMPS = 12;

const CURRENT_MOTORS = {
  fl_d: { label: 'FL Drive', topic: '/Left_front_wheel_joint/status', color: '#4da3ff', dashed: false },
  fr_d: { label: 'FR Drive', topic: '/Right_front_wheel_joint/status', color: '#ff7a45', dashed: false },
  rl_d: { label: 'BL Drive', topic: '/Left_back_wheel_joint/status', color: '#4cd964', dashed: false },
  rr_d: { label: 'BR Drive', topic: '/Right_back_wheel_joint/status', color: '#c77dff', dashed: false },
  fl_s: { label: 'FL Steer', topic: '/Left_front_wheel_arm_joint/status', color: '#4da3ff', dashed: true },
  fr_s: { label: 'FR Steer', topic: '/Right_front_wheel_arm_joint/status', color: '#ff7a45', dashed: true },
  rl_s: { label: 'BL Steer', topic: '/Left_back_wheel_arm_joint/status', color: '#4cd964', dashed: true },
  rr_s: { label: 'BR Steer', topic: '/Right_back_wheel_arm_joint/status', color: '#c77dff', dashed: true },
} as const;

type MotorKey = keyof typeof CURRENT_MOTORS;
const KEYS = Object.keys(CURRENT_MOTORS) as MotorKey[];

type Point = { time: number; value: number };
type CurrentHistory = Record<MotorKey, Point[]>;

const emptyCurrentHistory= () => Object.fromEntries(KEYS.map((key) => [key, []])) as unknown as CurrentHistory;

const MotorCurrentGraphPanel: React.FC = () => {
  const { ros } = useROS();
  const [currentHistory, setCurrentHistory] = useState<CurrentHistory>(emptyCurrentHistory);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ros) return;

    const unsubscribers = KEYS.map((key) => {
      const topic = new ROSLIB.Topic({
        ros,
        name: CURRENT_MOTORS[key].topic,
        messageType: 'ros_phoenix/msg/MotorStatus',
        throttle_rate: 100,
      });

      const handler = (msg: any) => {
        const value = Number(msg.output_current);
        if (!Number.isFinite(value)) return;

        const now = Date.now();
        const cutoff = now - WINDOW_MS;

        setCurrentHistory((prev) => {
          const next = {} as CurrentHistory;
          KEYS.forEach((k) => {
            next[k] = prev[k].filter((p) => p.time >= cutoff);
          });
          next[key].push({ time: now, value });
          return next;
        });
      };

      topic.subscribe(handler);
      return () => topic.unsubscribe(handler);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [ros]);

    const formatTime = (time: number) =>
        new Date(time).toLocaleTimeString([], {
        minute: '2-digit',
        second: '2-digit',
        });

    const downloadPNG = async () => {
        if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#181818',
    });

    const link = document.createElement('a');
    link.download = 'motor-currents.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="panel" ref={containerRef}>
      <div className="header">
        <h3>Motor Currents</h3>
        <div className="controls">
          <button onClick={downloadPNG}>PNG</button>
        </div>
    </div>

    <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />

            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTime}
              tick={{ fill: '#aaa', fontSize: 10 }}
              axisLine={{ stroke: '#444' }}
              tickLine={{ stroke: '#444' }}
              minTickGap={30}
            />

            <YAxis
              domain={[
                0,
                (dataMax: number) => Number.isFinite(dataMax) ? Math.max(DEFAULT_MAX_AMPS, Math.ceil(dataMax)) : DEFAULT_MAX_AMPS,
              ]}
              unit="A"
              tick={{ fill: '#aaa', fontSize: 10 }}
              axisLine={{ stroke: '#444' }}
              tickLine={{ stroke: '#444' }}
              width={55}
            />

            <Tooltip
              formatter={(value: number, name: string) => [`${Number(value).toFixed(2)} A`, name]}
              labelFormatter={(value) => formatTime(Number(value))}
              contentStyle={{
                background: '#222',
                border: '1px solid #444',
                borderRadius: '8px',
                color: '#fff',
              }}
            />

            <Legend wrapperStyle={{ color: '#f1f1f1', fontSize: 12 }} />

            {KEYS.map((key) => (
              <Line
                key={key}
                type="linear"
                data={currentHistory[key]}
                dataKey="value"
                name={CURRENT_MOTORS[key].label}
                stroke={CURRENT_MOTORS[key].color}
                strokeDasharray={CURRENT_MOTORS[key].dashed ? '5 3' : undefined}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .panel {
          background: #1e1e1e;
          color: #fff;
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid #2a2a2a;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #eee;
        }

        .controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        button {
          background: #242424;
          color: #ddd;
          border: 1px solid #3a3a3a;
          padding: 0.35rem 0.55rem;
          border-radius: 7px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        button:hover {
          background: #303030;
        }

        .chart {
          flex: 1;
          min-height: 0;
        }
      `}</style>
    </div>
  );
};

export default MotorCurrentGraphPanel;
