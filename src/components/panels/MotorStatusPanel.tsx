'use client';

import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

type MotorStatus = {
  velocity: number;
  temperature: number;
  output_current: number;
};

const MOTORS = {
  fl: { label: 'FLeft', topic: '/frontLeft/status' },
  fr: { label: 'FRight', topic: '/frontRight/status' },
  rl: { label: 'BLeft', topic: '/backLeft/status' },
  rr: { label: 'BRight', topic: '/backRight/status' },
} as const;

type MotorKey = keyof typeof MOTORS;

const MotorStatusPanel: React.FC = () => {
  const { ros } = useROS();

  const [motorStats, setMotorStats] = useState<
    Record<MotorKey, MotorStatus | null>
  >({
    fl: null,
    fr: null,
    rl: null,
    rr: null,
  });

  useEffect(() => {
    if (!ros) return;

    const unsubscribers = (
      Object.entries(MOTORS) as [MotorKey, typeof MOTORS[MotorKey]][]
    ).map(([key, { topic }]) => {
      const rosTopic = new ROSLIB.Topic({
        ros,
        name: topic,
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

      rosTopic.subscribe(handler);
      return () => rosTopic.unsubscribe(handler);
    });

    return () => unsubscribers.forEach(unsub => unsub());
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
          {(Object.entries(MOTORS) as [MotorKey, typeof MOTORS[MotorKey]][]).map(
            ([key, { label }]) => {
              const stat = motorStats[key];

              return (
                <tr key={key}>
                  <td>{label}</td>
                  <td>{stat ? stat.velocity.toFixed(2) : '-'}</td>
                  <td>{stat ? `${stat.temperature.toFixed(2)}°C` : '-'}</td>
                  <td>{stat ? `${stat.output_current.toFixed(2)}A` : '-'}</td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>

      <style jsx>{`
        .motor-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: auto;
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
