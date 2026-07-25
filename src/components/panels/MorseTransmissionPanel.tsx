'use client';
import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const MorseTransmissionPanel: React.FC = () => {
  const { ros } = useROS();

  const [message, setMessage] = useState('');
  const [lastSent, setLastSent] = useState<string | null>(null);

  const topicRef = useRef<ROSLIB.Topic | null>(null);

  useEffect(() => {
    if (!ros) {
      topicRef.current = null;
      return;
    }

    topicRef.current = new ROSLIB.Topic({
      ros,
      name: '/morse_transmission',
      messageType: 'std_msgs/msg/String',
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

  const send = () => {
    if (!topicRef.current || !message) return;
    topicRef.current.publish(new ROSLIB.Message({ data: message }));
    setLastSent(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  const disabled = !ros;

  return (
    <div className="morse-panel">
      <div className="controls">
        <input
          type="text"
          className="input"
          value={message}
          disabled={disabled}
          placeholder="Message to transmit..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn" disabled={disabled || !message} onClick={send}>
          Send
        </button>
      </div>

      {lastSent && <div className="last-sent">Last sent: {lastSent}</div>}

      <style jsx>{`
        .morse-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .controls {
          display: flex;
          gap: 0.75rem;
        }
        .input {
          flex: 1;
          background: #2a2a2a;
          color: #f1f1f1;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 0.5rem;
          outline: none;
        }
        .input:focus {
          border-color: #0070f3;
        }
        .input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn {
          background: #0070f3;
          color: #f1f1f1;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn:hover:enabled {
          background: #005fcc;
        }
        .btn:disabled {
          background: #333;
          cursor: not-allowed;
          opacity: 0.8;
        }
        .last-sent {
          margin-top: 0.5rem;
          color: #d6d6d6;
        }
      `}</style>
    </div>
  );
};

export default MorseTransmissionPanel;
