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
  time: number;
  value: number;
}

const TelemetryGraph: React.FC<Props> = ({ topic, label, color = '#4da3ff' }) => {
  const { ros } = useROS();
  const [data, setData] = useState<Point[]>([]);
  const [windowSize, setWindowSize] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ros) return;

    const rosTopic = new ROSLIB.Topic({
      ros,
      name: topic,
      messageType: 'std_msgs/msg/UInt16',
    });

    const handleMsg = (msg: any) => {
      const newPoint: Point = {
        time: Date.now(),
        value: Number(msg.data),
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

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#181818',
    });

    const link = document.createElement('a');
    link.download = `${label}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const formatTime = (time: number) =>
    new Date(time).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <div className="panel" ref={containerRef}>
      <div className="header">
        <div>
          <h3>{label}</h3>
          <p>{data.length > 0 ? data[data.length - 1].value : '--'}</p>
        </div>

        <div className="controls">
          <select
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
          >
            <option value={10}>10 samples</option>
            <option value={30}>30 samples</option>
            <option value={60}>60 samples</option>
            <option value={120}>120 samples</option>
          </select>

          <button onClick={downloadPNG}>PNG</button>
        </div>
      </div>

      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
          >
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
              domain={[0, 'auto']}
              tick={{ fill: '#aaa', fontSize: 10 }}
              axisLine={{ stroke: '#444' }}
              tickLine={{ stroke: '#444' }}
              width={45}
            />

            <Tooltip
              labelFormatter={(value) => formatTime(Number(value))}
              contentStyle={{
                background: '#222',
                border: '1px solid #444',
                borderRadius: '8px',
                color: '#fff',
              }}
            />

            <Line
              type="linear"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={true}
              isAnimationActive={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .panel {
          background: #181818;
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

        p {
          margin: 0.25rem 0 0;
          font-size: 1.4rem;
          font-weight: 700;
          color: ${color};
        }

        .controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        select,
        button {
          background: #242424;
          color: #ddd;
          border: 1px solid #3a3a3a;
          padding: 0.35rem 0.55rem;
          border-radius: 7px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        button:hover,
        select:hover {
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

export default TelemetryGraph;