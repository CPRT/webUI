'use client';
import React, { useState, useEffect } from 'react';
import { useROS } from '@/ros/ROSContext';
import ROSLIB from 'roslib';
import BusVoltageIndicator from '@/components/panels/BusVoltageIndicator';

const getVoltageColor = (voltage: number | null) => {
  if (voltage === null) return "#ffffff";
  if (voltage < 21.5 ) return "red"; //low voltage
  if (voltage < 22.5) return "#ffc42b"; //ok voltage 
  return "#22c55e"; //good voltage
};

const getOutlineColor = (voltage: number | null) => {
  if (voltage === null) return "#ffffff";
  if (voltage < 21.5) return "#ef4444";  // red outline when voltage low
  return "#fff"; //outline stays white otherwise 
};

const BusVoltageDisplay: React.FC = () => {
  const { ros } = useROS();
  const [busVoltage, setBusVoltage] = useState<number | null>(null)

  useEffect(() => {
    if (!ros) return;
    const voltageTopic = new ROSLIB.Topic({
      ros,
      name: '/bus_voltage',
      messageType: 'std_msgs/String',
    });
    const handleVoltageMessage = (message: any) => {
      setBusVoltage(Number(message.data));
    };
    voltageTopic.subscribe(handleVoltageMessage);
  }, [ros]);

const voltageColor = getVoltageColor(busVoltage);

  return (
    <div className="bus-voltage-display">
      <BusVoltageIndicator 
        className="bus-voltage-icon"
        color={voltageColor}
        outlineColor={getOutlineColor(busVoltage)}
      />
      <span className="voltage-text">
        {busVoltage !== null
          ? `${busVoltage.toFixed(1)} V`
          : '- V'}
      </span>

      <style jsx>{`
        .bus-voltage-display {
          display: inline-flex;
          align-items: center;
          gap: 0.1rem;
          font-size: 0.85rem;
          color: #ffffff;
        }

        .voltage-text {
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default BusVoltageDisplay;