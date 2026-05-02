'use client';

import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';
import html2canvas from 'html2canvas';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface Props {
  topic: string;
  label: string;
  color?: string;
}

interface Point {
  time: string;
  value: number;
}

const TelemetryGraph: React.FC<Props> = ({ topic, label, color = '#0070f3' }) => {
  const { ros } = useROS();
  const [data, setData] = useState<Point[]>([]);
  const [windowSize, setWindowSize] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ros) return;

    const rosTopic = new ROSLIB.Topic({
      ros,
      name: topic,
      messageType: 'std_msgs/msg/Float32',
    });

    const handleMsg = (msg: any) => {
      const newPoint: Point = {
        time: new Date().toLocaleTimeString(),
        value: msg.data,
      };

      setData((prev) => {
        const updated = [...prev, newPoint];
        return updated.length > windowSize ? updated.slice(-windowSize) : updated;
      });
    };

    rosTopic.subscribe(handleMsg);
    return () => rosTopic.unsubscribe(handleMsg);
  }, [ros, topic, windowSize]);

  const downloadPNG = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const link = document.createElement('a');
    link.download = `${label}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="panel" ref={containerRef}>
      <div className="header">
        <h3>{label}</h3>

        <div className="controls">
          <select
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
          >
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
            <option value={120}>120s</option>
          </select>

          <button onClick={downloadPNG}>Download PNG</button>
        </div>
      </div>

      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" tick={{ fill: '#eee', fontSize: 10 }} />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#eee', fontSize: 10 }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .panel {
          background: #1e1e1e;
          color: #fff;
          padding: 1rem;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        h3 {
          margin: 0;
          font-size: 1rem;
        }

        .controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        select,
        button {
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #444;
          padding: 0.3rem 0.5rem;
          border-radius: 6px;
          cursor: pointer;
        }

        button:hover {
          background: #3a3a3a;
        }

        .chart {
          flex: 1;
          min-height: 0;
        }
      `}</style>
    </div>
  );
};

export default TelemetryGraph;