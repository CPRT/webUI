'use client';

import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const DRIVE_THROTTLE_COOKIE = 'drive_throttle';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

const clampThrottle = (value: number) => {
  return Math.min(100, Math.max(0, value));
};

const getCookieNumber = (name: string, fallback: number) => {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return fallback;

  const value = Number(decodeURIComponent(cookie.split('=')[1]));

  if (!Number.isFinite(value)) return fallback;

  return clampThrottle(value);
};

const setCookieNumber = (name: string, value: number) => {
  document.cookie =
    `${name}=${encodeURIComponent(value)}; ` +
    `max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
};

const throttlePercentToFloat = (throttle: number) => {
  return clampThrottle(throttle) / 100;
};

const DriveThrottlePanel: React.FC = () => {
  const { ros } = useROS();

  const [throttleValue, setThrottleValue] = useState(100);
  const [cookiesLoaded, setCookiesLoaded] = useState(false);

  const throttleTopicRef = useRef<ROSLIB.Topic | null>(null);

  useEffect(() => {
    setThrottleValue(getCookieNumber(DRIVE_THROTTLE_COOKIE, 100));
    setCookiesLoaded(true);
  }, []);

  useEffect(() => {
    if (!cookiesLoaded) return;

    setCookieNumber(DRIVE_THROTTLE_COOKIE, throttleValue);
  }, [cookiesLoaded, throttleValue]);

  useEffect(() => {
    if (!ros) {
      throttleTopicRef.current = null;
      return;
    }

    throttleTopicRef.current = new ROSLIB.Topic({
      ros,
      name: '/drive_throttle',
      messageType: 'std_msgs/Float32',
    });

    return () => {
      try {
        throttleTopicRef.current?.unadvertise();
      } catch {
        // ignore cleanup errors
      }

      throttleTopicRef.current = null;
    };
  }, [ros]);

  useEffect(() => {
    if (!ros || !cookiesLoaded) return;

    throttleTopicRef.current?.publish(
      new ROSLIB.Message({
        data: throttlePercentToFloat(throttleValue),
      })
    );
  }, [ros, cookiesLoaded, throttleValue]);

  const throttleOff = () => {
    setThrottleValue(0);
  };

  return (
    <div className="throttle-panel">
      <div className="slider-container">
        <label>Drive Throttle</label>

        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            value={throttleValue}
            onChange={(e) => setThrottleValue(Number(e.target.value))}
            className="vertical-slider"
            disabled={!ros || !cookiesLoaded}
          />
        </div>

        <span>
          {throttleValue}% (
          {throttlePercentToFloat(throttleValue).toFixed(2)})
        </span>
      </div>

      <button
        className="off-button"
        onClick={throttleOff}
        disabled={!ros || !cookiesLoaded}
      >
        Throttle Off
      </button>

      <style jsx>{`
        .throttle-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .slider-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .slider-wrapper {
          height: 220px;
          width: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vertical-slider {
          width: 220px;
          height: 40px;
          transform: rotate(-90deg);
          cursor: pointer;
        }

        .slider-container span {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco,
            Consolas, 'Liberation Mono', 'Courier New', monospace;
          color: #ccc;
        }

        .off-button {
          width: 100%;
          padding: 0.75rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
        }

        .off-button:hover:enabled {
          background: #b52a37;
        }

        .off-button:disabled {
          background: #333;
          cursor: not-allowed;
          opacity: 0.8;
        }

        .vertical-slider:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

export default DriveThrottlePanel;