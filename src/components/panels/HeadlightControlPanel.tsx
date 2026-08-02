'use client';

import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const LEFT_HEADLIGHT_COOKIE = 'left_headlight_brightness';
const RIGHT_HEADLIGHT_COOKIE = 'right_headlight_brightness';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day
// Human perception of brightness is not linear. 
// This is a common gamma value to correct for perceived brightness.
const BRIGHTNESS_GAMMA = 2.2;

const clampBrightness = (value: number) => {
  return Math.min(100, Math.max(0, value));
};

const getCookieNumber = (name: string, fallback: number) => {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return fallback;

  const value = Number(decodeURIComponent(cookie.split('=')[1]));

  if (!Number.isFinite(value)) return fallback;

  return clampBrightness(value);
};

const setCookieNumber = (name: string, value: number) => {
  document.cookie =
    `${name}=${encodeURIComponent(value)}; ` +
    `max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
};

const perceivedBrightnessToPWM = (brightness: number) => {
  const normalizedBrightness = clampBrightness(brightness) / 100;

  if (normalizedBrightness <= 0) return 0;

  return Math.round(
    Math.pow(normalizedBrightness, BRIGHTNESS_GAMMA) * 100
  );
};

const HeadlightControlPanel: React.FC = () => {
  const { ros } = useROS();

  const [leftValue, setLeftValue] = useState(0);
  const [rightValue, setRightValue] = useState(0);
  const [cookiesLoaded, setCookiesLoaded] = useState(false);

  const leftTopicRef = useRef<ROSLIB.Topic | null>(null);
  const rightTopicRef = useRef<ROSLIB.Topic | null>(null);

  useEffect(() => {
    setLeftValue(getCookieNumber(LEFT_HEADLIGHT_COOKIE, 0));
    setRightValue(getCookieNumber(RIGHT_HEADLIGHT_COOKIE, 0));
    setCookiesLoaded(true);
  }, []);

  useEffect(() => {
    if (!cookiesLoaded) return;

    setCookieNumber(LEFT_HEADLIGHT_COOKIE, leftValue);
  }, [cookiesLoaded, leftValue]);

  useEffect(() => {
    if (!cookiesLoaded) return;

    setCookieNumber(RIGHT_HEADLIGHT_COOKIE, rightValue);
  }, [cookiesLoaded, rightValue]);

  useEffect(() => {
    if (!ros) {
      leftTopicRef.current = null;
      rightTopicRef.current = null;
      return;
    }

    leftTopicRef.current = new ROSLIB.Topic({
      ros,
      name: '/left_headlight',
      messageType: 'std_msgs/Int8',
    });

    rightTopicRef.current = new ROSLIB.Topic({
      ros,
      name: '/right_headlight',
      messageType: 'std_msgs/Int8',
    });

    return () => {
      try {
        leftTopicRef.current?.unadvertise();
        rightTopicRef.current?.unadvertise();
      } catch {
        // ignore cleanup errors
      }

      leftTopicRef.current = null;
      rightTopicRef.current = null;
    };
  }, [ros]);

  useEffect(() => {
    if (!ros || !cookiesLoaded) return;

    leftTopicRef.current?.publish(
      new ROSLIB.Message({
        data: perceivedBrightnessToPWM(leftValue),
      })
    );

    rightTopicRef.current?.publish(
      new ROSLIB.Message({
        data: perceivedBrightnessToPWM(rightValue),
      })
    );
  }, [ros, cookiesLoaded, leftValue, rightValue]);

  const allOff = () => {
    setLeftValue(0);
    setRightValue(0);
  };

  return (
    <div className="headlight-panel">
      <div className="sliders">
        <div className="slider-container">
          <label>Left</label>

          <div className="slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={leftValue}
              onChange={(e) => setLeftValue(Number(e.target.value))}
              className="vertical-slider"
              disabled={!ros || !cookiesLoaded}
            />
          </div>

          <span>{leftValue}%</span>
        </div>

        <div className="slider-container">
          <label>Right</label>

          <div className="slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={rightValue}
              onChange={(e) => setRightValue(Number(e.target.value))}
              className="vertical-slider"
              disabled={!ros || !cookiesLoaded}
            />
          </div>

          <span>{rightValue}%</span>
        </div>
      </div>

      <button
        className="off-button"
        onClick={allOff}
        disabled={!ros || !cookiesLoaded}
      >
        All Off
      </button>

      <style jsx>{`
        .headlight-panel {
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

        .sliders {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3rem;
        }

        .slider-container {
          display: flex;
          flex-direction: column;
          align-items: center;
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

export default HeadlightControlPanel;