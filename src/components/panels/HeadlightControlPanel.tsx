'use client';

import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const HeadlightControlPanel: React.FC = () => {
  const { ros } = useROS();

  const [leftValue, setLeftValue] = useState(0);
  const [rightValue, setRightValue] = useState(0);

  const leftTopicRef = useRef<ROSLIB.Topic | null>(null);
  const rightTopicRef = useRef<ROSLIB.Topic | null>(null);

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
    if (!ros) return;

    leftTopicRef.current?.publish(
      new ROSLIB.Message({
        data: leftValue,
      })
    );

    rightTopicRef.current?.publish(
      new ROSLIB.Message({
        data: rightValue,
      })
    );
  }, [ros, leftValue, rightValue]);

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
              disabled={!ros}
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
              disabled={!ros}
            />
          </div>

          <span>{rightValue}%</span>
        </div>
      </div>

      <button className="off-button" onClick={allOff} disabled={!ros}>
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