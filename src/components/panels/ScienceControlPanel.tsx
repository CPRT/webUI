'use client';

import React, { useEffect, useState } from 'react';
import { useROS } from '@/ros/ROSContext';
import ROSLIB from 'roslib';

// --------------------
// Types + Config
// --------------------

interface RunPolarimeterResponse {
  success: boolean;
  message: string;
  file_path: string;
}

type MotorConfig = {
  id: number;
  name: string;
  defaultTime: number;
  defaultDuty: number;
};

type ServoConfig = {
  id: number;
  name: string;
  defaultPosition: number;
  minPulseUs: number;
  maxPulseUs: number;
  maxDegrees: number;
};

type SendMotorFn = (
  motorID: number,
  value: number,
  duration?: number,
  ramp?: number
) => void;

type SendServoFn = (
  motorID: number,
  value: number,
) => void;

type MotorProps = {
  motor: MotorConfig;
  sendCommand: SendMotorFn;
  disabled: boolean;
};

type ServoMotorProps = {
  motor: ServoConfig;
  sendCommand: SendServoFn;
  disabled: boolean;
};

const DEFAULT_RAMP = 0;

const motors: MotorConfig[] = [
  { id: 1, name: 'Strip', defaultTime: 10.0, defaultDuty: 100 },
  { id: 0, name: 'Resin Pump', defaultTime: 2.5, defaultDuty: 100 },
  { id: 5, name: 'Polar', defaultTime: 1.5, defaultDuty: 100 },
  { id: 4, name: 'Benedict', defaultTime: 2.5, defaultDuty: 100 },
  { id: 2, name: 'Stirrer', defaultTime: 10.0, defaultDuty: 50 },
  { id: 6, name: 'Heater', defaultTime: 20.0, defaultDuty: 75 },
]

const servos: ServoConfig[] = [
  {
    id: 2,
    name: 'Disk Servo',
    defaultPosition: 90,
    minPulseUs: 615,
    maxPulseUs: 2495,
    maxDegrees: 195,
  },
  {
    id: 0,
    name: 'Resin Servo',
    defaultPosition: 45,
    minPulseUs: 350,
    maxPulseUs: 2500,
    maxDegrees: 360,
  }
];

// --------------------
// Panel
// --------------------
const ScienceControlPanel: React.FC = () => {
  const { ros } = useROS();

  const [title, setTitle] = useState<string>("");
  const [polarStatus, setPolarStatus] = useState<string>("");

  const sendMotor: SendMotorFn = (
    motorID,
    value,
    duration,
    ramp = DEFAULT_RAMP
  ) => {
    if (!ros) return;

    const safeDuration = Math.round(
      Math.min(Math.max(duration ?? 0, 0), 6553.5) * 10
    );

    const dutyCycle = Math.min(Math.max(value, 0), 100);

    const topic = new ROSLIB.Topic({
      ros,
      name: '/science/motor',
      messageType: 'interfaces/msg/ScienceMotor',
    });

    topic.publish(
      new ROSLIB.Message({
        pin: motorID,
        duty_cycle: dutyCycle,
        duration: safeDuration,
        ramp,
      })
    );
  };

  const sendServo: SendServoFn = (
    motorID,
    value,
  ) => {
    if (!ros) return;

    const topic = new ROSLIB.Topic({
      ros,
      name: '/science/servo',
      messageType: 'interfaces/msg/ScienceServo',
    });

    topic.publish(
      new ROSLIB.Message({
        pin: motorID,
        us: value,
      })
    );
  };

  const handlePolar = () => {
    if (!ros) return;
    
    setPolarStatus("Waiting...");

    const polarSrv = new ROSLIB.Service({
      ros,
      name: "/run_polarimeter",
      serviceType: "interfaces/srv/RunPolarimeter",
    });

    polarSrv.callService(
      new ROSLIB.ServiceRequest({title: title}),
      (response: RunPolarimeterResponse) => {
        setPolarStatus(response.success ? "Success: " + response.message : "Failed");
      },
    );
  };

  return (
    <div className="panel">
      <div className="motor-grid">
        {motors.map((motor) =>
            <DCMotor
              key={`${motor.id}-${motor.name}`}
              motor={motor}
              sendCommand={sendMotor}
              disabled={!ros}
            />
          )
        }
        {servos.map((servo) => (
            <ServoMotor
              key={`${servo.id}-${servo.name}`}
              motor={servo}
              sendCommand={sendServo}
              disabled={!ros}
            />
          )
        )}
      <div className="motor">
        <h4>Polarimeter</h4>
  
        <label>
          Title
          <input
            type="text"
            value={title}
            disabled={!ros}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
  
        <div className="buttons servo-buttons">
          <button disabled={!ros} onClick={handlePolar}>
            Go
          </button>
          {polarStatus}
        </div>
      </div>
      </div>

      <style jsx>{`
        .panel {
          background: radial-gradient(circle at top, #2a2a2a, #151515);
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 12px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        h3 {
          margin: 0 0 1rem 0;
          text-align: center;
          font-size: 1.3rem;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #444;
          padding-bottom: 0.6rem;
        }

        .motor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        :global(.motor) {
          background: linear-gradient(145deg, #2b2b2b, #202020);
          border: 1px solid #3a3a3a;
          border-radius: 10px;
          padding: 0.75rem;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        :global(.motor h4) {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #eaeaea;
        }

        :global(label) {
          font-size: 0.75rem;
          color: #aaa;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        :global(input) {
          padding: 0.35rem;
          border-radius: 6px;
          border: 1px solid #444;
          background: #111;
          color: #fff;
          font-size: 0.85rem;
          width: 100%;
        }

        :global(input:focus) {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 5px rgba(0, 112, 243, 0.4);
        }

        :global(.buttons) {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.4rem;
          margin-top: 0.4rem;
        }

        :global(.servo-buttons) {
          grid-template-columns: 1fr 1fr;
        }

        :global(button) {
          padding: 0.4rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 500;
          transition: 0.15s ease;
          color: white;
          background: #0070f3;
        }

        :global(button:hover:enabled) {
          background: #005fcc;
        }

        :global(.stop) {
          background: #dc3545;
        }

        :global(.stop:hover:enabled) {
          background: #b52a37;
        }

        :global(.reset) {
          background: #555;
        }

        :global(.reset:hover:enabled) {
          background: #666;
        }

        :global(button:disabled) {
          background: #2f2f2f;
          color: #777;
          cursor: not-allowed;
        }

        :global(.countdown) {
          font-size: 0.8rem;
          color: #00ffcc;
          font-weight: 600;
        }

        :global(.progress-bg) {
          width: 100%;
          height: 6px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        :global(.progress-fill) {
          height: 100%;
          background: #00ffcc;
          transition: width 0.1s linear;
        }
      `}</style>
    </div>
  );
};

// --------------------
// DC Motor Component
// --------------------
const DCMotor: React.FC<MotorProps> = ({
  motor,
  sendCommand,
  disabled,
}) => {
  const [time, setTime] = useState<number>(motor.defaultTime);
  const [duty, setDuty] = useState<number>(motor.defaultDuty);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(motor.defaultTime);

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  useEffect(() => {
    if (remaining === null) return;

    if (remaining <= 0) {
      setRemaining(null);
      return;
    }

    const interval = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return null;

        const next = prev - 0.1;
        return next <= 0 ? null : next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [remaining]);

  const handleGo = () => {
    const safeTime = clamp(time, 0, 6553.5);
    const safeDuty = clamp(duty, 0, 100);

    sendCommand(motor.id, safeDuty, safeTime);

    setStartTime(safeTime);
    setRemaining(safeTime);
  };

  const handleStop = () => {
    sendCommand(motor.id, 0, 0);
    setRemaining(null);
  };

  const progressPercent =
    remaining !== null && startTime > 0
      ? Math.max(0, Math.min(100, (remaining / startTime) * 100))
      : 0;

  return (
    <div className="motor">
      <h4>{motor.name}</h4>

      <label>
        Time (s)
        <input
          type="number"
          step="0.1"
          min="0"
          max="6553.5"
          value={time}
          disabled={disabled}
          onChange={(e) => setTime(Number(e.target.value))}
        />
      </label>

      <label>
        Duty (%)
        <input
          type="number"
          step="1"
          min="0"
          max="100"
          value={duty}
          disabled={disabled}
          onChange={(e) => setDuty(Number(e.target.value))}
        />
      </label>

      {remaining !== null && (
        <>
          <div className="countdown">{remaining.toFixed(1)}s remaining</div>

          <div className="progress-bg">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </>
      )}

      <div className="buttons">
        <button disabled={disabled || remaining !== null} onClick={handleGo}>
          Go
        </button>

        <button className="stop" disabled={disabled} onClick={handleStop}>
          Stop
        </button>

        <button
          className="reset"
          disabled={disabled}
          onClick={() => {
            setTime(motor.defaultTime);
            setDuty(motor.defaultDuty);
            setRemaining(null);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

// --------------------
// Servo Motor Component
// --------------------
const ServoMotor: React.FC<ServoMotorProps> = ({
  motor,
  sendCommand,
  disabled,
}) => {
  const [position, setPosition] = useState<number>(motor.defaultPosition);

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  const handleGo = () => {
    const safePos = clamp(position, 0, motor.maxDegrees);

    const pulseUs = Math.round(
      motor.minPulseUs +
      (safePos / motor.maxDegrees) * (motor.maxPulseUs - motor.minPulseUs));

    sendCommand(motor.id, pulseUs); 
  };

  return (
    <div className="motor">
      <h4>{motor.name}</h4>

      <label>
        Position (0–{motor.maxDegrees})
        <input
          type="number"
          step="1"
          min="0"
          max={motor.maxDegrees}
          value={position}
          disabled={disabled}
          onChange={(e) => setPosition(Number(e.target.value))}
        />
      </label>

      <div className="buttons servo-buttons">
        <button disabled={disabled} onClick={handleGo}>
          Go
        </button>
      </div>
    </div>
  );
};

export default ScienceControlPanel;
