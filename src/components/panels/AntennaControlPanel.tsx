'use client';
import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';
import { LatLngTuple } from 'leaflet';
import { haversineDistance } from '../BreadCrumbTrail';

const AntennaControlPanel: React.FC = () => {
  const { ros } = useROS();

  const [enabled, setEnabled] = useState(false);
  const [leftHeld, setLeftHeld] = useState(false);
  const [rightHeld, setRightHeld] = useState(false);
  const [roverLoc, setRoverLoc] = useState<LatLngTuple>([0, 0]);
  const [antennaLoc, setAntennaLoc] = useState<LatLngTuple>([0, 0]);
  const [bearing, setBearing] = useState<number>(0);
  const [targetBearing, setTargetBearing] = useState<number>(0);

  const antStatusTopicRef = useRef<ROSLIB.Topic | null>(null);
  const antValTopicRef = useRef<ROSLIB.Topic | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Create/cleanup topic when ROS connection changes
  useEffect(() => {
    if (!ros) {
      antValTopicRef.current = null;
      return;
    }

    antValTopicRef.current = new ROSLIB.Topic({
      ros,
      name: '/antenna/manual_value',
      messageType: 'std_msgs/Float32',
    });

    antStatusTopicRef.current = new ROSLIB.Topic({
      ros,
      name: '/antenna/manual',
      messageType: 'std_msgs/Bool',
    });

    const fixTopic = new ROSLIB.Topic({
      ros,
      name: '/gps/fix',
      messageType: 'sensor_msgs/NavSatFix',
    });
    
    const antennaFixTopic = new ROSLIB.Topic({
      ros,
      name: '/base_station/fix',
      messageType: 'sensor_msgs/NavSatFix',
    });

    const bearingTopic = new ROSLIB.Topic({
      ros,
      name: '/antenna/bearing',
      messageType: 'std_msgs/Float32',
    });
    
    const targetBearingTopic = new ROSLIB.Topic({
      ros,
      name: '/antenna/target_bearing',
      messageType: 'std_msgs/Float32',
    });
    
    const handleFix = (message: any) => {
      // Assuming the /fix message contains 'latitude' and 'longitude'
      const { latitude, longitude } = message;
      setRoverLoc([latitude, longitude]);
    }

    const handleAntennaFix = (message: any) => {
      // Assuming the /fix message contains 'latitude' and 'longitude'
      const { latitude, longitude } = message;
      setAntennaLoc([latitude, longitude]);
    };

    const handleBearing = (message: any) => {
      const angle = message.data * 180 / Math.PI;
      setBearing(angle);
    };
   
    const handleTargetBearing = (message: any) => {
      const angle = message.data * 180 / Math.PI;
      setTargetBearing(angle);
    };
    
    fixTopic.subscribe(handleFix);
    antennaFixTopic.subscribe(handleAntennaFix);
    bearingTopic.subscribe(handleBearing);
    targetBearingTopic.subscribe(handleTargetBearing);
    return () => {
      try {
        antStatusTopicRef.current?.unadvertise();
        antValTopicRef.current?.unadvertise();
      } catch {
        // ignore
      }
      antStatusTopicRef.current = null;
      antValTopicRef.current = null;
      antennaFixTopic.unsubscribe(handleAntennaFix);
      bearingTopic.unsubscribe(handleBearing);
      targetBearingTopic.unsubscribe(handleTargetBearing);
    };
  }, [ros]);

  // Determine what value should be published right now
  const computeValue = () => {
    if (enabled) return 0.0;
    if (leftHeld && !rightHeld) return -Math.PI / 180 * 1;
    if (rightHeld && !leftHeld) return Math.PI / 180 * 1;
    return 0.0; // neither held OR both held
  };

  // Start/stop the 100ms publish loop
  useEffect(() => {
    if (!ros || !antValTopicRef.current || !antStatusTopicRef.current) return;

    // Clear any previous loop
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Publish immediately, then every 100ms
    const publishNow = () => {
      const value = computeValue();
      const manual_mode = !enabled;
      antValTopicRef.current?.publish(new ROSLIB.Message({ data: value }));
      antStatusTopicRef.current?.publish(new ROSLIB.Message({ data: manual_mode }));
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
  }, [ros, enabled, leftHeld, rightHeld]);

  // If user disables controls, clear held state so it goes to 0 cleanly
  useEffect(() => {
    if (enabled) {
      setLeftHeld(false);
      setRightHeld(false);
    }
  }, [enabled]);

  const setHeld = (side: 'left' | 'right', held: boolean) => {
    if (enabled) return;
    if (side === 'left') setLeftHeld(held);
    else setRightHeld(held);
  };

  const btnDisabled = enabled || !ros;

  const bearingDelta = ((targetBearing - bearing + 180) % 360 -180).toFixed(1)

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
      <div style={{ marginBottom: '0.125rem' }}>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Auto tracking
        </label>
      </div>
      <div style={{ marginBottom: '0.125rem' }}>
        <strong>Pointing:</strong>
        <br />
        Delta: <span className={Math.abs(bearingDelta) < 15 ? 'ok' : 'bad'}>{bearingDelta}</span>°
        <br />
        Bearing: {bearing.toFixed(1)}°
        <br />
        Target Bearing: {targetBearing.toFixed(1)}°
      </div>
      <div style={{ marginBottom: '0.125rem' }}>
        <strong>Location:</strong>
        <br />
          Distance to Rover: {(haversineDistance(antennaLoc, roverLoc) * 1000).toFixed(2)} m
          <br />
          Lat: {antennaLoc[0].toFixed(6)}
          <br />
          Lon: {antennaLoc[1].toFixed(6)}
      </div>
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
