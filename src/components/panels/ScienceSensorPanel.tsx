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

interface ADCPoint {
  time: number;
  adc1: number;
  adc2: number;
  adc3: number;
}

interface CO2Point {
  time: number;
  co2: number;
}

type SensorKey = 'adc1' | 'adc2' | 'adc3' | 'co2';

type Temp = {
  temperature: number;
  humidity: number;
}

const SENSOR_OPTIONS: {
  key: SensorKey;
  label: string;
  color: string;
  unit: string;
}[] = [
  {
    key: 'adc1',
    label: 'ADC 1',
    color: '#0070f3',
    unit: '',
  },
  {
    key: 'co2',
    label: 'CO₂',
    color: '#28a745',
    unit: 'ppm',
  },
  {
    key: 'adc2',
    label: 'ADC 2',
    color: '#ff8800',
    unit: '',
  },
  {
    key: 'adc3',
    label: 'ADC 3',
    color: '#ff4d4d',
    unit: '°C',
  },
];

const ScienceSensorPanel: React.FC = () => {
  const { ros } = useROS();

  const [adc, setAdc] = useState<ADCPoint[]>([]);
  const [co2, setCo2] = useState<CO2Point[]>([]);
  const [temp, setTemp] = useState<Temp>();
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>('adc1');
  const [windowSize, setWindowSize] = useState(30);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => {
    return SENSOR_OPTIONS.find((option) => option.key === selectedSensor)!;
  }, [selectedSensor]);

  useEffect(() => {
    if (!ros) return;

    const adcTopic = new ROSLIB.Topic({
      ros,
      name: '/science/adc',
      messageType: 'interfaces/msg/ScienceADC',
    });

    const handleSensorReading = (msg: any) => {
      const newPoint: ADCPoint = {
        time: Date.now(),
        adc1: msg.adc1,
        adc2: msg.adc2,
        adc3: msg.adc3,
      };

      setAdc((prev) => {
        const updated = [...prev, newPoint];
        return updated.length > windowSize ? updated.slice(-windowSize) : updated;
      });
    };

    adcTopic.subscribe(handleSensorReading);

    return () => {
      adcTopic.unsubscribe(handleSensorReading);
    };
  }, [ros, windowSize]);

  useEffect(() => {
    if (!ros) return;

    const co2Topic = new ROSLIB.Topic({
      ros,
      name: '/science/co2',
      messageType: 'std_msgs/msg/UInt16',
    });

    const handleSensorReading = (msg: any) => {
      const newPoint: CO2Point = {
        time: Date.now(),
        co2: msg.data,
      };

      setCo2((prev) => {
        const updated = [...prev, newPoint];
        return updated.length > windowSize ? updated.slice(-windowSize) : updated;
      });
    };

    co2Topic.subscribe(handleSensorReading);

    return () => {
      co2Topic.unsubscribe(handleSensorReading);
    };
  }, [ros, windowSize]);
  
  useEffect(() => {
    if (!ros) return;

    const tempTopic = new ROSLIB.Topic({
      ros,
      name: '/science/temp',
      messageType: 'interfaces/msg/DHT22',
    });

    const handleTempReading = (msg: any) => {
      setTemp(msg);
    };

    tempTopic.subscribe(handleTempReading);

    return () => {
      tempTopic.unsubscribe(handleTempReading);
    };
  }, [ros]);

  const latestValue = selectedSensor == 'co2' ? 
      (co2.length > 0 ? co2[co2.length - 1][selectedSensor] : null)
    : (adc.length > 0 ? adc[adc.length - 1][selectedSensor] : null);

  const formatTime = (time: number) =>
    new Date(time).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    });

  const formatValue = (value: number) => {
    return `${value.toFixed(0)}${selectedOption.unit}`;
  };

  const downloadPNG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#181818',
    });

    const link = document.createElement('a');
    link.download = `science-${selectedSensor}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="panel" ref={containerRef}>
      <div className="header">
        <div>
          <h3>Science Sensor Reading</h3>
          <p className="sensor-name">Temperature: {temp?.temperature?.toFixed(1)} deg C    Humidity: {temp?.humidity?.toFixed(1)}%</p>
          <p className="latest-value">
            {selectedOption.label}: {latestValue !== null ? formatValue(latestValue) : '--'}
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
            data={selectedSensor == 'co2' ? co2 : adc}
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

export default ScienceSensorPanel;
