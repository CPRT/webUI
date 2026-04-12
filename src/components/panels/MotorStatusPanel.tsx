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
  fl_d: { label: 'FLeft_Drive', topic: '/Left_front_wheel_joint/status' },
  fr_d: { label: 'FRight_Drive', topic: '/Right_front_wheel_joint/status' },
  rl_d: { label: 'BLeft_Drive', topic: '/Left_back_wheel_joint/status' },
  rr_d: { label: 'BRight_Drive', topic: '/Right_back_wheel_joint/status' },
  fl_s: { label: 'FLeft_Steer', topic: '/Left_front_wheel_arm_joint/status' },
  fr_s: { label: 'FRight_Steer', topic: '/Right_front_wheel_arm_joint/status' },
  rl_s: { label: 'BLeft_Steer', topic: '/Left_back_wheel_arm_joint/status' },
  rr_s: { label: 'BRight_Steer', topic: '/Right_back_wheel_arm_joint/status' },
} as const;

type MotorKey = keyof typeof MOTORS;

const MotorStatusPanel: React.FC = () => {
  const { ros } = useROS();

  const [motorStats, setMotorStats] = useState<
    Record<MotorKey, MotorStatus | null>
  >({
    fl_d: null,
    fr_d: null,
    rl_d: null,
    rr_d: null,
    fl_s: null,
    fr_s: null,
    rl_s: null,
    rr_s: null,
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
