'use client';
import React, { useState, useEffect } from 'react';
import { useROS } from '@/ros/ROSContext';
import ROSLIB from 'roslib';


const modeColors: { [key: string]: string } = {
  TeleOP: '#0070f3',       // blue
  Autonomous: '#28a745',   // green
  Manual: '#dc3545',       // red
  IK: '#ffc107',           // yellow
  Science: '#17a2b8',      // cyan
  Idle: '#6c757d',         // grey
};

const RoverModeDisplay: React.FC = () => {
  const { ros } = useROS();
  const [currentMode, setCurrentMode] = useState<string>('Unknown');
  const [modeStartTime, setModeStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!ros) return;
    const modeTopic = new ROSLIB.Topic({
      ros,
      name: '/rover_mode',
      messageType: 'std_msgs/String',
    });
    const handleModeMessage = (message: any) => {
      if (message.data !== currentMode) {
        setCurrentMode(message.data);
        setModeStartTime(Date.now());
        setElapsed(0);
      }
    };
    modeTopic.subscribe(handleModeMessage);
    return () => modeTopic.unsubscribe(handleModeMessage);
  }, [ros, currentMode]);

  // update every one second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - modeStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [modeStartTime]);

  const modeColor = modeColors[currentMode] || '#ffc107';

  return (
    <div className="rover-mode-display">
      {/*TY chat gpt for styling this*/}
      <span className="mode-indicator" style={{ backgroundColor: modeColor }} />
      <span className="mode-text">{currentMode}</span>
      <span className="mode-timer">{elapsed}s</span>
      <style jsx>{`
        .rover-mode-display {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: #fff;
        }
        .mode-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid #fff;
        }
        .mode-text {
          font-weight: bold;
        }
        .mode-timer {
          font-size: 0.75rem;
          color: #ccc;
        }
      `}</style>
    </div>
  );
};

export default RoverModeDisplay;

