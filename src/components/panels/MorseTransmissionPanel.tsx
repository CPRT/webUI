'use client';
import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

type DetectionType = 'NONE' | 'MORSE' | string;

const MorseTransmissionPanel: React.FC = () => {
  const { ros } = useROS();

  const [message, setMessage] = useState('');
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [receivedText, setReceivedText] = useState('');
  const [detectionType, setDetectionType] = useState<DetectionType | null>(null);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const topicRef = useRef<ROSLIB.Topic | null>(null);

  useEffect(() => {
    if (!ros) {
      topicRef.current = null;
      setDetectionType(null);
      setReceivedText('');
      return;
    }

    topicRef.current = new ROSLIB.Topic({
      ros,
      name: '/morse_transmission',
      messageType: 'std_msgs/msg/String',
    });

    const morseTextTopic = new ROSLIB.Topic({
      ros,
      name: '/morse_text',
      messageType: 'std_msgs/msg/String',
    });

    const handleMorseText = (msg: ROSLIB.Message) => {
      const data = (msg as { data?: string }).data;
      setReceivedText(typeof data === 'string' ? data : '');
    };

    morseTextTopic.subscribe(handleMorseText);

    return () => {
      try {
        topicRef.current?.unadvertise();
      } catch {
        // ignore
      }
      topicRef.current = null;
      morseTextTopic.unsubscribe(handleMorseText);
    };
  }, [ros]);

  const refreshDetectionType = () => {
    if (!ros) return;

    const service = new ROSLIB.Service({
      ros,
      name: '/detect_node/get_parameters',
      serviceType: 'rcl_interfaces/srv/GetParameters',
    });

    const request = new ROSLIB.ServiceRequest({
      names: ['detection_type'],
    });

    service.callService(request, (result: any) => {
      const value = result.values?.[0];
      if (!value || value.type !== 4) {
        setStatus('Failed to read detection_type');
        return;
      }
      setDetectionType(value.string_value ?? 'NONE');
    });
  };

  useEffect(() => {
    refreshDetectionType();
  }, [ros]);

  const setDetectParameter = (
    name: string,
    value: { type: number; string_value?: string; bool_value?: boolean },
    onSuccess?: () => void,
  ) => {
    if (!ros) return;

    setUpdating(true);
    setStatus(null);

    const service = new ROSLIB.Service({
      ros,
      name: '/detect_node/set_parameters',
      serviceType: 'rcl_interfaces/srv/SetParameters',
    });

    const request = new ROSLIB.ServiceRequest({
      parameters: [{ name, value }],
    });

    service.callService(request, (result: any) => {
      const parameterResult = result.results?.[0];
      const success = parameterResult?.successful ?? false;
      const reason = parameterResult?.reason ?? '';

      setUpdating(false);

      if (!success) {
        setStatus(reason || `Failed to set ${name}`);
        if (name === 'detection_type') refreshDetectionType();
        return;
      }

      onSuccess?.();
      setStatus(`Set ${name} successfully`);
    });
  };

  const handleMorseToggle = (enabled: boolean) => {
    const mode = enabled ? 'MORSE' : 'NONE';
    setDetectParameter(
      'detection_type',
      { type: 4, string_value: mode },
      () => setDetectionType(mode),
    );
  };

  const setCalibrate = () => {
    setDetectParameter('calibrate', { type: 1, bool_value: true });
  };

  const setStartDetection = () => {
    setDetectParameter('start_detection', { type: 1, bool_value: true });
  };

  const send = () => {
    if (!topicRef.current || !message) return;
    topicRef.current.publish(new ROSLIB.Message({ data: message }));
    setLastSent(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  const disabled = !ros;
  const detectDisabled = disabled || updating || detectionType === null;
  const morseEnabled = detectionType === 'MORSE';
  const morseActionsDisabled = detectDisabled || !morseEnabled;

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

      <div className="detect-section">
        <div className="detect-header">Detection Options</div>
        <div className="detect-controls">
        <label className="toggle-row">
          <span>Morse Detection</span>
          <input
            type="checkbox"
            checked={morseEnabled}
            disabled={detectDisabled}
            onChange={(e) => handleMorseToggle(e.target.checked)}
          />
        </label>
        <button className="btn" disabled={morseActionsDisabled} onClick={setCalibrate}>
          Calibrate
        </button>
        <button
          className="btn"
          disabled={morseActionsDisabled}
          onClick={setStartDetection}
        >
          Start Detection
        </button>
        </div>
        <div className="received-row">
          <label htmlFor="morse-text-received">Received text</label>
          <input
            id="morse-text-received"
            type="text"
            className="input"
            value={receivedText}
            readOnly
            disabled={disabled}
            placeholder="Waiting for /morse_text..."
          />
        </div>
      </div>

      {lastSent && <div className="last-sent">Last sent: {lastSent}</div>}
      {status && <div className="status">{status}</div>}

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
        .detect-section {
          margin-top: 0.75rem;
        }
        .detect-header {
          color: #d6d6d6;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .detect-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }
        .toggle-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.6rem;
          border: 1px solid #333;
          border-radius: 6px;
          background: #2b2b2b;
          color: #ccc;
          cursor: pointer;
        }
        .toggle-row input {
          width: 1.1rem;
          height: 1.1rem;
          cursor: pointer;
        }
        .toggle-row input:disabled {
          cursor: not-allowed;
        }
        .received-row {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-top: 0.75rem;
        }
        .received-row label {
          color: #d6d6d6;
          font-size: 0.9rem;
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
        .last-sent,
        .status {
          margin-top: 0.5rem;
          color: #d6d6d6;
        }
      `}</style>
    </div>
  );
};

export default MorseTransmissionPanel;
