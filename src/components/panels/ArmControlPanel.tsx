'use client';

import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const ArmControlPanel: React.FC = () => {
  const { ros } = useROS();

  const [poseNames, setPoseNames] = useState<string[]>([]);
  const [selectedPose, setSelectedPose] = useState('');
  const [response, setResponse] = useState<{ success: boolean; message: string } | null>(null);

  const refreshPoseNames = () => {
    if (!ros) return;

    const service = new ROSLIB.Service({
      ros,
      name: '/get_names_poses',
      serviceType: 'interfaces/srv/GetPoses',
    });

    const request = new ROSLIB.ServiceRequest({});

    service.callService(request, (result: any) => {
      const names = result.pose_names ?? [];
      setPoseNames(names);

      if (names.length > 0 && !selectedPose) {
        setSelectedPose(names[0]);
      }
    });
  };

  useEffect(() => {
    refreshPoseNames();
  }, [ros]);

  const handleGo = () => {
    if (!ros) {
      alert('ROS is not connected');
      return;
    }

    if (!selectedPose) {
      setResponse({ success: false, message: 'No pose selected' });
      return;
    }

    const service = new ROSLIB.Service({
      ros,
      name: '/go_to_pose',
      serviceType: 'interfaces/srv/GoToPose',
    });

    const request = new ROSLIB.ServiceRequest({
      name: selectedPose,
    });

    service.callService(request, (result: any) => {
      setResponse({
        success: result.success,
        message: result.message,
      });
    });
  };

  const handleStop = () => {
    if (!ros) {
      alert('ROS is not connected');
      return;
    }

    const service = new ROSLIB.Service({
      ros,
      name: '/stop_motion',
      serviceType: 'std_srvs/srv/Trigger',
    });

    const request = new ROSLIB.ServiceRequest({});

    service.callService(request, (result: any) => {
      setResponse({
        success: result.success,
        message: result.message,
      });
    });
  };

  return (
    <div className="arm-panel">
      <div className="input-group">
        <label>Named State:</label>
        <select
          value={selectedPose}
          onChange={(e) => setSelectedPose(e.target.value)}
          disabled={poseNames.length === 0}
        >
          {poseNames.length === 0 ? (
            <option value="">No named states found</option>
          ) : (
            poseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))
          )}
        </select>
      </div>

      <button onClick={handleGo} disabled={!selectedPose}>
        Go
      </button>

      <button className="stop-button" onClick={handleStop}>
        Stop
      </button>

      {response && (
        <div className={`response ${response.success ? 'success' : 'failure'}`}>
          {response.message}
        </div>
      )}

      <style jsx>{`
        .arm-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.75rem;
        }

        label {
          margin-bottom: 0.25rem;
        }

        select {
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

        button:disabled {
          background: #555;
          cursor: not-allowed;
        }

        .stop-button {
          background: #dc3545;
        }

        .stop-button:hover {
          background: #b02a37;
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

export default ArmControlPanel;