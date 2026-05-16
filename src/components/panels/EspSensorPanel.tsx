'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Legend,
} from 'recharts';

interface EspSensorReadings {
  methane: number;
  co2: number;
  polarimeter: number;
  temperature: number;
  moisture: number;
}

type SensorKey = keyof EspSensorReadings;

interface Point {
  time: number;
  methane: number;
  co2: number;
  polarimeter: number;
  temperature: number;
  moisture: number;
}

const SENSOR_OPTIONS: {
  key: SensorKey;
  label: string;
  color: string;
  unit: string;
}[] = [
  {
    key: 'methane',
    label: 'Methane',
    color: '#0070f3',
    unit: '',
  },
  {
    key: 'co2',
    label: 'CO₂',
    color: '#28a745',
    unit: '',
  },
  {
    key: 'polarimeter',
    label: 'Polarimeter',
    color: '#ff8800',
    unit: '',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    color: '#ff4d4d',
    unit: '°C',
  },
  {
    key: 'moisture',
    label: 'Moisture',
    color: '#b84dff',
    unit: '%',
  },
];

const EspSensorPanel: React.FC = () => {
  const { ros } = useROS();

  const [data, setData] = useState<Point[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>('methane');
  const [windowSize, setWindowSize] = useState(30);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => {
    return SENSOR_OPTIONS.find((option) => option.key === selectedSensor)!;
  }, [selectedSensor]);

  useEffect(() => {
    if (!ros) return;

    const sensorTopic = new ROSLIB.Topic({
      ros,
      name: '/esp_sensor_readings',
      messageType: 'interfaces/msg/EspSensorReadings',
    });

    const handleSensorReading = (msg: any) => {
      const newPoint: Point = {
        time: Date.now(),
        methane: Number(msg.methane),
        co2: Number(msg.co2),
        polarimeter: Number(msg.polarimeter),
        temperature: Number(msg.temperature),
        moisture: Number(msg.moisture),
      };

      setData((prev) => {
        const updated = [...prev, newPoint];
        return updated.length > windowSize ? updated.slice(-windowSize) : updated;
      });
    };

    sensorTopic.subscribe(handleSensorReading);

    return () => {
      sensorTopic.unsubscribe(handleSensorReading);
    };
  }, [ros, windowSize]);

  const latestValue =
    data.length > 0 ? data[data.length - 1][selectedSensor] : null;

  const formatTime = (time: number) =>
    new Date(time).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    });

  const formatValue = (value: number) => {
    if (selectedSensor === 'temperature' || selectedSensor === 'moisture') {
      return `${value.toFixed(1)}${selectedOption.unit}`;
    }

    return `${value.toFixed(0)}${selectedOption.unit}`;
  };

  const downloadPNG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#181818',
    });

    const link = document.createElement('a');
    link.download = `esp-${selectedSensor}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="panel" ref={containerRef}>
      <div className="header">
        <div>
          <h3>ESP Sensor Reading</h3>
          <p className="sensor-name">{selectedOption.label}</p>
          <p className="latest-value">
            {latestValue !== null ? formatValue(latestValue) : '--'}
          </p>
        </div>

        <div className="controls">
          <select
            value={selectedSensor}
            onChange={(e) => setSelectedSensor(e.target.value as SensorKey)}
          >
            {SENSOR_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>

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
              domain={['auto', 'auto']}
              tickFormatter={(value) => formatValue(Number(value))}
              tick={{ fill: '#aaa', fontSize: 10 }}
              axisLine={{ stroke: '#444' }}
              tickLine={{ stroke: '#444' }}
              width={55}
            />

            <Tooltip
              formatter={(value: number) => [
                formatValue(Number(value)),
                selectedOption.label,
              ]}
              labelFormatter={(value) => formatTime(Number(value))}
              contentStyle={{
                background: '#222',
                border: '1px solid #444',
                borderRadius: '8px',
                color: '#fff',
              }}
            />

            <Legend wrapperStyle={{ color: '#f1f1f1', fontSize: 12 }} />

            <Line
              type="linear"
              dataKey={selectedSensor}
              stroke={selectedOption.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 3 }}
              name={selectedOption.label}
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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

        .sensor-name {
          margin: 0.25rem 0 0;
          font-size: 0.8rem;
          color: #aaa;
        }

        .latest-value {
          margin: 0.2rem 0 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: ${selectedOption.color};
        }

        .controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
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

export default EspSensorPanel;