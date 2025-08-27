'use client';
import React, { useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const GoalSetterPanel: React.FC = () => {
  const { ros } = useROS();
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [response, setResponse] = useState<{ success: boolean; status: string } | null>(null);

  const handleSendGoal = () => {
    if (!ros) {
      alert('ROS is not connected');
      return;
    }

    const service = new ROSLIB.Service({
      ros,
      name: '/set_goal',
      serviceType: 'interfaces/srv/SetGoal',
    });

    const request = new ROSLIB.ServiceRequest({
      goal: {
        position: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          altitude: NaN,
        },
        orientation: {
          x: 0.0,
          y: 0.0,
          z: 0.0,
          w: 1.0,
        },
      },
    });

    service.callService(request, (result: any) => {
      setResponse({ success: result.success, status: result.status });
    });
  };

  return (
    <div className="goal-panel">
      <h3>Set Navigation Goal</h3>
      <div className="input-group">
        <label>Latitude:</label>
        <input
          type="number"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="e.g. 37.7749"
        />
      </div>
      <div className="input-group">
        <label>Longitude:</label>
        <input
          type="number"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="e.g. -122.4194"
        />
      </div>
      <button onClick={handleSendGoal}>Send Goal</button>
      {response && (
        <div className={`response ${response.success ? 'success' : 'failure'}`}>
          {response.status}
        </div>
      )}
      <style jsx>{`
        .goal-panel {
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
        .input-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.75rem;
        }
        label {
          margin-bottom: 0.25rem;
        }
        input {
          padding: 0.5rem;
          border: 1px solid #333;
          border-radius: 4px;
          background: #2b2b2b;
          color: #f1f1f1;
        }
        button {
          background: #0070f3;
          color: #f1f1f1;
          padding: 0.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        button:hover {
          background: #005fcc;
        }
        .response {
          margin-top: 1rem;
          padding: 0.5rem;
          border-radius: 4px;
        }
        .success {
          background: #28a745;
        }
        .failure {
          background: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default GoalSetterPanel;
