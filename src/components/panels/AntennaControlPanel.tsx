'use client';
import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const AntennaControlPanel: React.FC = () => {
  const { ros } = useROS();

  const [disabled, setDisabled] = useState(false);
  const [leftHeld, setLeftHeld] = useState(false);
  const [rightHeld, setRightHeld] = useState(false);

  const topicRef = useRef<ROSLIB.Topic | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Create/cleanup topic when ROS connection changes
  useEffect(() => {
    if (!ros) {
      topicRef.current = null;
      return;
    }

    topicRef.current = new ROSLIB.Topic({
      ros,
      name: '/antenna_control',
      messageType: 'std_msgs/Float32',
    });

    return () => {
      try {
        topicRef.current?.unadvertise();
      } catch {
        // ignore
      }
      topicRef.current = null;
    };
  }, [ros]);

  // Determine what value should be published right now
  const computeValue = () => {
    if (disabled) return 0.0;
    if (leftHeld && !rightHeld) return -0.5;
    if (rightHeld && !leftHeld) return 0.5;
    return 0.0; // neither held OR both held
  };

  // Start/stop the 100ms publish loop
  useEffect(() => {
    if (!ros || !topicRef.current) return;

    // Clear any previous loop
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Publish immediately, then every 100ms
    const publishNow = () => {
      const value = computeValue();
      topicRef.current?.publish(new ROSLIB.Message({ data: value }));
    };

    publishNow();
    intervalRef.current = window.setInterval(publishNow, 100);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ros, disabled, leftHeld, rightHeld]);

  // If user disables controls, clear held state so it goes to 0 cleanly
  useEffect(() => {
    if (disabled) {
      setLeftHeld(false);
      setRightHeld(false);
    }
  }, [disabled]);

  const setHeld = (side: 'left' | 'right', held: boolean) => {
    if (disabled) return;
    if (side === 'left') setLeftHeld(held);
    else setRightHeld(held);
  };

  const btnDisabled = disabled || !ros;

  return (
    <div className="antenna-panel">
      <div className="controls">
        <button
          className="btn"
          disabled={btnDisabled}
          onMouseDown={() => setHeld('left', true)}
          onMouseUp={() => setHeld('left', false)}
          onMouseLeave={() => setHeld('left', false)}
          onTouchStart={() => setHeld('left', true)}
          onTouchEnd={() => setHeld('left', false)}
          onTouchCancel={() => setHeld('left', false)}
        >
          Left
        </button>

        <button
          className="btn"
          disabled={btnDisabled}
          onMouseDown={() => setHeld('right', true)}
          onMouseUp={() => setHeld('right', false)}
          onMouseLeave={() => setHeld('right', false)}
          onTouchStart={() => setHeld('right', true)}
          onTouchEnd={() => setHeld('right', false)}
          onTouchCancel={() => setHeld('right', false)}
        >
          Right
        </button>
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={disabled}
          onChange={(e) => setDisabled(e.target.checked)}
        />
        Auto tracking
      </label>

      <style jsx>{`
        .antenna-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          text-align: center;
          border-bottom: 1px solid #444;
          padding-bottom: 0.5rem;
        }
        .controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .btn {
          background: #0070f3;
          color: #f1f1f1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          user-select: none;
          touch-action: manipulation;
        }
        .btn:hover:enabled {
          background: #005fcc;
        }
        .btn:disabled {
          background: #333;
          cursor: not-allowed;
          opacity: 0.8;
        }
        .checkbox {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          color: #d6d6d6;
        }
        .ok {
          color: #28a745;
          font-weight: 600;
        }
        .bad {
          color: #dc3545;
          font-weight: 600;
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
            'Courier New', monospace;
        }
      `}</style>
    </div>
  );
};

export default AntennaControlPanel;
