'use client';

import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

type MotorStatus = {
  velocity: number;
  output_current: number;
  active_errors: number;
};

const MOTORS = {
  fl_d: { label: 'FLeft Drive', topic: '/Left_front_wheel_joint/status' },
  fr_d: { label: 'FRight Drive', topic: '/Right_front_wheel_joint/status' },
  rl_d: { label: 'BLeft Drive', topic: '/Left_back_wheel_joint/status' },
  rr_d: { label: 'BRight Drive', topic: '/Right_back_wheel_joint/status' },
  fl_s: { label: 'FLeft Steer', topic: '/Left_front_wheel_arm_joint/status' },
  fr_s: { label: 'FRight Steer', topic: '/Right_front_wheel_arm_joint/status' },
  rl_s: { label: 'BLeft Steer', topic: '/Left_back_wheel_arm_joint/status' },
  rr_s: { label: 'BRight Steer', topic: '/Right_back_wheel_arm_joint/status' },
  j1: { label: 'Base', topic: '/Joint_1/status'},
  j2: { label: 'Shoulder', topic: '/Joint_2/status'},
  j3: { label: 'Elbow Pivot', topic: '/Joint_3/status'},
  j4: { label: 'Elbow Spin', topic: '/Joint_4/status'},
  j5: { label: 'Wrist Pivot', topic: '/Joint_5/status'},
  j6: { label: 'Wrist Spin', topic: '/Joint_6/status'},
  eef: { label: 'End Effector', topic: '/end_effector/status'},
} as const;

type MotorKey = keyof typeof MOTORS;

const MotorError: Record<string, number> = {
  INITIALIZING: 1,
  SYSTEM_LEVEL: 2,
  TIMING_ERROR: 4,
  MISSING_ESTIMATE: 8,
  BAD_CONFIG: 16,
  DRV_FAULT: 32,
  MISSING_INPUT: 64,
  DC_BUS_OVER_VOLTAGE: 256,
  DC_BUS_UNDER_VOLTAGE: 512,
  DC_BUS_OVER_CURRENT: 1024,
  DC_BUS_OVER_REGEN_CURRENT: 2048,
  CURRENT_LIMIT_VIOLATION: 4096,
  MOTOR_OVER_TEMP: 8192,
  INVERTER_OVER_TEMP: 16384,
  VELOCITY_LIMIT_VIOLATION: 32768,
  POSITION_LIMIT_VIOLATION: 65536,
  REQUESTED_CURRENT_TOO_HIGH: 131072,
  WATCHDOG_TIMER_EXPIRED: 16777216,
  ESTOP_REQUESTED: 33554432,
  SPINOUT_DETECTED: 67108864,
  BRAKE_RESISTOR_DISARMED: 134217728,
  THERMISTOR_DISCONNECTED: 268435456,
  CALIBRATION_ERROR: 1073741824,
};

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
    j1: null,
    j2: null,
    j3: null,
    j4: null,
    j5: null,
    j6: null,
    eef: null,
  });

  const [resettingMotors, setResettingMotors] = useState<
    Partial<Record<MotorKey, boolean>>
  >({});

  const getClearErrorsServiceName = (topic: string) =>
    topic.replace(/\/status$/, '/clear_errors');

  const handleResetErrors = (key: MotorKey, topic: string) => {
    if (!ros || resettingMotors[key]) return;

    setResettingMotors(prev => ({ ...prev, [key]: true }));

    const service = new ROSLIB.Service({
      ros,
      name: getClearErrorsServiceName(topic),
      serviceType: 'std_srvs/srv/Trigger',
    });

    service.callService(
      new ROSLIB.ServiceRequest({}),
      () => {
        setMotorStats(prev => ({
          ...prev,
          [key]: prev[key]
            ? {
                ...prev[key],
                active_errors: 0,
              }
            : prev[key],
        }));
        setResettingMotors(prev => ({ ...prev, [key]: false }));
      },
      () => {
        setResettingMotors(prev => ({ ...prev, [key]: false }));
      },
    );
  };

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
            output_current: msg.output_current,
            active_errors: msg.active_errors
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
            <th>Curr.</th>
            <th>Errors</th>
            <th>Reset</th>
          </tr>
        </thead>
        <tbody>
          {(Object.entries(MOTORS) as [MotorKey, typeof MOTORS[MotorKey]][]).map(
            ([key, { label, topic }]) => {
              const stat = motorStats[key];
              var errorStr = '-';
              if (stat) {
                var errNames: string[] = [];
                Object.keys(MotorError).forEach((key: string) => { if (stat.active_errors & MotorError[key]) errNames.push(key) })
                errorStr = errNames.length ? errNames.join(', ') : "NONE";
              }

              return (
                <tr key={key}>
                  <td>{label}</td>
                  <td>{stat ? stat.velocity.toFixed(2) : '-'}</td>
                  <td>{stat ? `${stat.output_current.toFixed(2)}A` : '-'}</td>
                  <td><span className="status-led" style={{ backgroundColor: errorStr == "NONE" ? "#22c55e" : "#ef4444" }}/><span style={{ paddingLeft: "8px" }}>{errorStr}</span></td>
                  <td>
                    <button
                      className="reset-button"
                      disabled={!ros || resettingMotors[key]}
                      onClick={() => handleResetErrors(key, topic)}
                    >
                      {resettingMotors[key] ? 'Resetting...' : 'Reset'}
                    </button>
                  </td>
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

        .status-led {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        .reset-button {
          background: #3b3b3b;
          color: #f1f1f1;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
        }

        .reset-button:hover:not(:disabled) {
          background: #4a4a4a;
        }

        .reset-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default MotorStatusPanel;