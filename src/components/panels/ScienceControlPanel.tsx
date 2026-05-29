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

type DCMotorConfig = {
  id: number;
  name: string;
  defaultTime: number;
  defaultDuty: number;
  frequency: number;
  type: 'dc';
};

type ServoConfig = {
  id: number;
  name: string;
  defaultPosition: number;
  minPulseUs: number;
  maxPulseUs: number;
  maxDegrees: number;
  frequency: number;
  type: 'servo';
};

type MotorConfig = DCMotorConfig | ServoConfig;

type SendCommandFn = (
  motorID: number,
  type: number,
  value: number,
  duration?: number,
  frequency?: number,
  ramp?: number
) => void;

type DCMotorProps = {
  motor: DCMotorConfig;
  sendCommand: SendCommandFn;
  disabled: boolean;
};

type ServoMotorProps = {
  motor: ServoConfig;
  sendCommand: SendCommandFn;
  disabled: boolean;
};

const TYPE_DC = 0;
const TYPE_SERVO = 1;

function isDCMotor(motor: MotorConfig): motor is DCMotorConfig {
  return motor.type === 'dc';
}

const PWM_MAX = 1023;
const DEFAULT_PWM_FREQUENCY = 50;
const DEFAULT_RAMP = 0;

const motors: MotorConfig[] = [
  { id: 18, name: 'Strip', defaultTime: 3.0, defaultDuty: 50, frequency: 2000, type: 'dc' },
  { id: 23, name: 'Resin Pump', defaultTime: 2.5, defaultDuty: 50, frequency: 2000, type: 'dc' },
  { id: 22, name: 'Polar', defaultTime: 1.5, defaultDuty: 50, frequency: 2000, type: 'dc' },
  { id: 21, name: 'Benedict', defaultTime: 2.5, defaultDuty: 50, frequency: 2000, type: 'dc' },
  { id: 19, name: 'Stirrer', defaultTime: 10.0, defaultDuty: 75, frequency: 2000, type: 'dc' },
  { id: 16, name: 'Heater', defaultTime: 10.0, defaultDuty: 75, frequency: 2000, type: 'dc' },

  {
    id: 13,
    name: 'Disk Servo',
    defaultPosition: 90,
    minPulseUs: 615,
    maxPulseUs: 2495,
    maxDegrees: 195,
    frequency: 50,
    type: 'servo',
  },
  {
    id: 32,
    name: 'Resin Servo',
    defaultPosition: 45,
    minPulseUs: 350,
    maxPulseUs: 2500,
    maxDegrees: 360,
    frequency: 50,
    type: 'servo',
  }
];

// --------------------
// Panel
// --------------------
const ScienceControlPanel: React.FC = () => {
  const { ros } = useROS();

  const [title, setTitle] = useState<string>("");
  const [polarStatus, setPolarStatus] = useState<string>("");

  const sendCommand: SendCommandFn = (
    motorID,
    type,
    value,
    duration,
    frequency,
    ramp = DEFAULT_RAMP
  ) => {
    if (!ros) return;

    const safeDurationMs = Math.round(
      Math.min(Math.max(duration ?? 0, 0), 65.535) * 10
    );

    const safeDutyPercent = Math.min(Math.max(value, 0), 100);
    const dutyCycle = Math.round((safeDutyPercent / 100) * PWM_MAX);

    const topic = new ROSLIB.Topic({
      ros,
      name: '/esp_pwm_command',
      messageType: 'interfaces/msg/PwmCommand',
    });

    topic.publish(
      new ROSLIB.Message({
        pin: motorID,
        type: type,
        duty_cycle: dutyCycle,
        duration: safeDurationMs,
        frequency,
        ramp,
      })
    );

    console.log('[SCIENCE PWM CMD]', {
      pin: motorID,
      type: type,
      duty_cycle: dutyCycle,
      duration: safeDurationMs,
      frequency,
      ramp,
    });
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
      <h3>Science Control</h3>

      <div className="motor-grid">
        {motors.map((motor) =>
          isDCMotor(motor) ? (
            <DCMotor
              key={`${motor.type}-${motor.id}-${motor.name}`}
              motor={motor}
              sendCommand={sendCommand}
              disabled={!ros}
            />
          ) : (
            <ServoMotor
              key={`${motor.type}-${motor.id}-${motor.name}`}
              motor={motor}
              sendCommand={sendCommand}
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
const DCMotor: React.FC<DCMotorProps> = ({
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
    const safeTime = clamp(time, 0, 65.535);
    const safeDuty = clamp(duty, 0, 100);

    sendCommand(motor.id, TYPE_DC, safeDuty, safeTime, motor.frequency);

    setStartTime(safeTime);
    setRemaining(safeTime);
  };

  const handleStop = () => {
    sendCommand(motor.id, TYPE_DC, 0, 0, motor.frequency);
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
          max="65.535"
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

    const pulseUs =
      motor.minPulseUs +
      (safePos / motor.maxDegrees) * (motor.maxPulseUs - motor.minPulseUs);

    const dutyPercent = (pulseUs * motor.frequency / 1000000) * 100;
    sendCommand(motor.id, TYPE_SERVO, dutyPercent, 0, motor.frequency); 
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
