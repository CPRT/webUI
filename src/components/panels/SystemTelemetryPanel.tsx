'use client';
import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
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

interface TelemetryData {
  time: string;
  cpu_usage: number;
  mem_usage: number;
  gpu_usage: number;
}

const SystemTelemetryPanel: React.FC = () => {
  const { ros } = useROS();
  const [data, setData] = useState<TelemetryData[]>([]);

  useEffect(() => {
    if (!ros) return;

    const telemetryTopic = new ROSLIB.Topic({
      ros,
      name: '/system_telemetry',
      messageType: 'interfaces/msg/SystemTelemetry',
    });

    const handleTelemetry = (msg: any) => {
      const newData: TelemetryData = {
        time: new Date().toLocaleTimeString(),
        cpu_usage: msg.cpu_usage,
        mem_usage: msg.mem_usage,
        gpu_usage: msg.gpu_usage,
      };

      // circular buffer, size 30
      setData((prev) => {
        const updated = [...prev, newData];
        if (updated.length > 30) {
          updated.shift();
        }
        return updated;
      });
    };

    telemetryTopic.subscribe(handleTelemetry);
    return () => telemetryTopic.unsubscribe(handleTelemetry);
  }, [ros]);

  return (
    <div className="telemetry-panel">
      <h3>System Telemetry</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" tick={{ fill: '#f1f1f1', fontSize: 10 }} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
              tick={{ fill: '#f1f1f1', fontSize: 10 }}
            />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            <Legend wrapperStyle={{ color: '#f1f1f1', fontSize: 12 }} />
            <Line type="monotone" dataKey="cpu_usage" stroke="#0070f3" name="CPU" dot={false} />
            <Line type="monotone" dataKey="mem_usage" stroke="#28a745" name="Memory" dot={false} />
            <Line type="monotone" dataKey="gpu_usage" stroke="#ff8800" name="GPU" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/*ty chat gpt for styling this*/}
      <style jsx>{`
        .telemetry-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        h3 {
          margin: 0;
          margin-bottom: 1rem;
          font-size: 1.25rem;
          text-align: center;
          border-bottom: 1px solid #444;
          padding-bottom: 0.5rem;
        }
        .chart-container {
          flex: 1;
          min-height: 0;
        }
      `}</style>
    </div>
  );
};

export default SystemTelemetryPanel;

