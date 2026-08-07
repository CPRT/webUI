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

interface DrillPoint {
  time: number;
  drill_cur: number;
}

interface ElevatorPoint {
  time: number;
  height: number;
  elev_cur: number;
}

type SensorKey = 'adc1' | 'adc2' | 'adc3' | 'co2' | 'motor';

type Temp = {
  temperature: number;
  humidity: number;
}

interface MotorStatus {
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

const CM_PER_TICK = 0.15 / 13 / 70; // 1.5 mm pitch thread, 1:13 gear ratio, 12-bit encoder
const DRILL_HEIGHT = 52;

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
    unit: '',
  },
  {
    key: 'motor',
    label: 'Motors',
    color: '',
    unit: '',
  },
];

const ScienceSensorPanel: React.FC = () => {
  const { ros } = useROS();

  const [adc, setAdc] = useState<ADCPoint[]>([]);
  const [co2, setCo2] = useState<CO2Point[]>([]);
  const [drill, setDrill] = useState<DrillPoint[]>([]);
  const [elevator, setElevator] = useState<ElevatorPoint[]>([]);
  const [temp, setTemp] = useState<Temp>();
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>('adc1');
  const [windowSize, setWindowSize] = useState(30);
  const [zero, setZero] = useState<number>(0); // TODO: Service for resetting talon encoder estimate

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

  useEffect(() => {
    if (!ros) return;

    const drillTopic = new ROSLIB.Topic({
      ros,
      name: '/drill/status',
      messageType: 'ros_phoenix/msg/MotorStatus',
    });

    const handleDrillReading = (msg: any) => {
      const newPoint: DrillPoint = {
        time: Date.now(),
        drill_cur: (msg as MotorStatus).output_current,
      };

      setDrill((prev) => {
        const updated = [...prev, newPoint];
        return updated.length > windowSize ? updated.slice(-windowSize) : updated;
      });
    };

    drillTopic.subscribe(handleDrillReading);

    return () => {
      drillTopic.unsubscribe(handleDrillReading);
    };
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const elevatorTopic = new ROSLIB.Topic({
      ros,
      name: '/elevator/status',
      messageType: 'ros_phoenix/msg/MotorStatus',
    });

    const handleElevatorReading = (msg: any) => {
      const newPoint: ElevatorPoint = {
        time: Date.now(),
        elev_cur: (msg as MotorStatus).output_current,
        height: DRILL_HEIGHT + (((msg as MotorStatus).position) * CM_PER_TICK) - zero,
      };

      setElevator((prev) => {
        const updated = [...prev, newPoint];
        return updated.length > windowSize ? updated.slice(-windowSize) : updated;
      });
    };

    elevatorTopic.subscribe(handleElevatorReading);

    return () => {
      elevatorTopic.unsubscribe(handleElevatorReading);
    };
  }, [ros]);

  const latestValue = selectedSensor=== 'motor' ? null : (selectedSensor === 'co2' ? 
      (co2.length > 0 ? co2[co2.length - 1][selectedSensor] : null)
    : (adc.length > 0 ? adc[adc.length - 1][selectedSensor] : null));

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
          <p className="sensor-name">Temperature: {temp?.temperature?.toFixed(1)}°C    Humidity: {temp?.humidity?.toFixed(1)}%</p>
          {selectedSensor === 'motor' ? (
            <p className="latest-value">
              <button
                style={{ marginRight: '10px',
                         padding: '0.4rem',
                         border: 'none',
                         borderRadius: '6px',
                         fontSize: '0.8rem',
                         cursor: 'pointer',
                         fontWeight: '500',
                         transition: '0.15s ease',
                         color: 'white',
                         background: '#0070f3',
                      }} 
                onClick={() => {setZero(elevator.length > 0 ? elevator[elevator.length - 1].height : 0)}}
              >
                Set Fully UP
              </button>
              <span>Height: {elevator.length > 0 ? elevator[elevator.length - 1].height.toFixed(2) : 0} cm</span>
              <span style={{ paddingLeft: '25px' }}>Elev. Cur: {elevator.length > 0 ? elevator[elevator.length - 1].elev_cur.toFixed(2) : 0} A</span>
              <span style={{ paddingLeft: '25px' }}>Drill Cur: {drill.length > 0 ? drill[drill.length - 1].drill_cur.toFixed(2) : 0} A</span>
            </p>
          ) : (
            <p className="latest-value">
              {selectedOption.label}: {latestValue !== null ? formatValue(latestValue) : '--'}
            </p>
          )}
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
        {selectedSensor === 'motor' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
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
                yAxisId="left"
                domain={['auto', 'auto']}
                tickFormatter={(value) => formatValue(Number(value))}
                tick={{ fill: '#aaa', fontSize: 10 }}
                axisLine={{ stroke: '#444' }}
                tickLine={{ stroke: '#444' }}
                width={55}
                unit="A"
              />
              <YAxis
                yAxisId="right"
                domain={['auto', 'auto']}
                tickFormatter={(value) => formatValue(Number(value))}
                tick={{ fill: '#aaa', fontSize: 10 }}
                axisLine={{ stroke: '#444' }}
                tickLine={{ stroke: '#444' }}
                width={55}
                orientation="right"
                unit="cm"
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value.toFixed(2),
                  name,
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
                yAxisId="left"
                type="linear"
                data={drill}
                dataKey="drill_cur"
                stroke="#ff4d4d"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 3 }}
                name="Drill Current (A)"
              />
              <Line
                yAxisId="left"
                type="linear"
                data={elevator}
                dataKey="elev_cur"
                stroke="#ff8800"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 3 }}
                name="Elevator Current (A)"
              />
              <Line
                yAxisId="right"
                type="linear"
                data={elevator}
                dataKey="height"
                stroke="#28a745"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 3 }}
                name="Height (cm)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
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
        )}
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
