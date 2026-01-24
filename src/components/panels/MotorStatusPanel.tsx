'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

type MotorStatus = {
  velocity: number;
  temperature: number;
  output_current: number;
};

const MotorStatusPanel: React.FC = () => {
  const { ros } = useROS();
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  const [motorStats, setMotorStats] = useState<{
    fl: MotorStatus | null;
    fr: MotorStatus | null;
    rl: MotorStatus | null;
    rr: MotorStatus | null;
  }>({
    fl: null,
    fr: null,
    rl: null,
    rr: null,
  });


  useEffect(() => {
    if (!ros) return;

    const motors = {
      fl: '/frontLeft/status',
      fr: '/frontRight/status',
      rl: '/backLeft/status',
      rr: '/backRight/status',
    };

    const subscriptions = Object.entries(motors).map(([key, topicName]) => {
      const topic = new ROSLIB.Topic({
        ros,
        name: topicName,
        messageType: 'ros_phoenix/msg/MotorStatus',
        throttle_rate: 100,
      });

      const handler = (msg: any) => {
        setMotorStats(prev => ({
          ...prev,
          [key]: {
            velocity: msg.velocity,
            temperature: msg.temperature,
            output_current: msg.output_current,
          },
        }));
      };

      topic.subscribe(handler);
      return () => topic.unsubscribe(handler);
    });

    return () => subscriptions.forEach(unsub => unsub());
  }, [ros]);




  return (
    <div className="motor-panel">
      <table className="motor-table">
        <thead>
          <tr>
            <th>Motor</th>
            <th>Vel.</th>
            <th>Temp.</th>
            <th>Curr.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>FLeft</td>
            <td>{motorStats.fl?.velocity.toFixed(2) || '-'}</td>
            <td>{motorStats.fl?.temperature.toFixed(2) || '-'}°C</td>
            <td>{motorStats.fl?.output_current.toFixed(2) || '-'}A</td>
          </tr>
          <tr>
            <td>FRight</td>
            <td>{motorStats.fr?.velocity.toFixed(2) || '-'}</td>
            <td>{motorStats.fr?.temperature.toFixed(2) || '-'}°C</td>
            <td>{motorStats.fr?.output_current.toFixed(2) || '-'}A</td>
          </tr>
          <tr>
            <td>BLeft</td>
            <td>{motorStats.rl?.velocity.toFixed(2) || '-'}</td>
            <td>{motorStats.rl?.temperature.toFixed(2) || '-'}°C</td>
            <td>{motorStats.rl?.output_current.toFixed(2) || '-'}A</td>
          </tr>
          <tr>
            <td>BRight</td>
            <td>{motorStats.rr?.velocity.toFixed(2) || '-'}</td>
            <td>{motorStats.rr?.temperature.toFixed(2) || '-'}°C</td>
            <td>{motorStats.rr?.output_current.toFixed(2) || '-'}A</td>
          </tr>
        </tbody>
      </table>

      <style jsx>{`
        .motor-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: auto;
        }
        h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.25rem;
          text-align: center;
          border-bottom: 1px solid #444;
        }
        .motor-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }
        .motor-table thead {
          background: #2d2d2d;
          border-bottom: 2px solid #444;
        }
        .motor-table th {
          text-align: left;
          font-weight: 600;
          color: #f1f1f1;
        }
        .motor-table td {
          border-bottom: 1px solid #333;
        }
        .motor-table tbody tr:hover {
          background-color: #262626;
        }
      `}</style>
    </div>
  );
};

export default MotorStatusPanel;
