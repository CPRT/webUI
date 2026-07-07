'use client';

import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const ArmControlPanel: React.FC = () => {
  const { ros } = useROS();

  const [poseNames, setPoseNames] = useState<string[]>([]);
  const [selectedPose, setSelectedPose] = useState('');
  const [presetName, setPresetName] = useState('');
  const [armState, setArmState] = useState<string | null>(null);
  const [servoStatus, setServoStatus] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceStatus, setDistanceStatus] = useState<number | null>(null);
  const [checkCollisions, setCheckCollisions] = useState(false);
  const [collisionParameterLoaded, setCollisionParameterLoaded] = useState(false);
  const [collisionParameterUpdating, setCollisionParameterUpdating] = useState(false);
  const [response, setResponse] = useState<{ success: boolean; message: string } | null>(null);

  const refreshPoseNames = (preferredPose?: string) => {
    if (!ros) return;

    const service = new ROSLIB.Service({
      ros,
      name: '/move_group_interface/get_named_targets',
      serviceType: 'interfaces/srv/GetNamedTargets',
    });

    const request = new ROSLIB.ServiceRequest({});

    service.callService(request, (result: any) => {
      const success = result.success ?? false;
      const msg = result.message ?? '';
      if (!success) {
        setPoseNames([]);
        setSelectedPose('');
        setResponse({ success: false, message: `Failed to get named targets: ${msg}` });
        return;
      }

      const names = result.names ?? [];
      setPoseNames(names);

      if (preferredPose && names.includes(preferredPose)) {
        setSelectedPose(preferredPose);
      } else if (names.length > 0 && !selectedPose) {
        setSelectedPose(names[0]);
      } else if (selectedPose && !names.includes(selectedPose)) {
        setSelectedPose(names[0] ?? '');
      }
    });
  };

  const refreshCollisionChecking = () => {
    if (!ros) return;

    setCollisionParameterLoaded(false);

    const service = new ROSLIB.Service({
      ros,
      name: '/servo_node/get_parameters',
      serviceType: 'rcl_interfaces/srv/GetParameters',
    });

    const request = new ROSLIB.ServiceRequest({
      names: ['moveit_servo.check_collisions'],
    });

    service.callService(request, (result: any) => {
      const value = result.values?.[0];

      if (!value || value.type !== 1) {
        setCollisionParameterLoaded(false);
        setResponse({
          success: false,
          message: 'Failed to read /servo_node check_collisions parameter',
        });
        return;
      }

      setCheckCollisions(value.bool_value ?? false);
      setCollisionParameterLoaded(true);
    });
  };

  useEffect(() => {
    refreshPoseNames();
    refreshCollisionChecking();
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const stateTopic = new ROSLIB.Topic({
      ros,
      name: '/arm_teleop_node/state',
      messageType: 'std_msgs/msg/String',
      queue_size: 1,
    });

    const handleState = (msg: any) => {
      setArmState(msg.data);
    };

    stateTopic.subscribe(handleState);

    return () => {
      stateTopic.unsubscribe(handleState);
    };
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const statusTopic = new ROSLIB.Topic({
      ros,
      name: '/servo_node/status',
      messageType: 'moveit_msgs/msg/ServoStatus',
      queue_size: 1,
    });

    const handleServoStatus = (msg: any) => {
      setServoStatus(msg.message);
    };

    statusTopic.subscribe(handleServoStatus);

    return () => {
      statusTopic.unsubscribe(handleServoStatus);
    };
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const distanceTopic = new ROSLIB.Topic({
      ros,
      name: '/eef_distance',
      messageType: 'interfaces/msg/Distance',
    });

    const handleDistance = (msg: any) => {
      setDistance(msg.distance);
      setDistanceStatus(msg.status);
    };

    distanceTopic.subscribe(handleDistance);

    return () => {
      distanceTopic.unsubscribe(handleDistance);
    };
  }, [ros]);

  const getDistanceDisplay = () => {
    const GRIPPER_OFFSET = 0.18;
    if (distance === null) return 'No data';
    const distance_with_offset = distance - GRIPPER_OFFSET;

    if (distanceStatus === 1) return `Error (${distance_with_offset.toFixed(3)})`;
    if (distanceStatus === 2) return `Invalid (${distance_with_offset.toFixed(3)})`;

    return distance_with_offset.toFixed(3);
  };

  const handleCollisionCheckingChange = (enabled: boolean) => {
    if (!ros) {
      alert('ROS is not connected');
      return;
    }

    setCollisionParameterUpdating(true);

    const service = new ROSLIB.Service({
      ros,
      name: '/servo_node/set_parameters',
      serviceType: 'rcl_interfaces/srv/SetParameters',
    });

    const request = new ROSLIB.ServiceRequest({
      parameters: [
        {
          name: 'moveit_servo.check_collisions',
          value: {
            type: 1,
            bool_value: enabled,
          },
        },
      ],
    });

    service.callService(request, (result: any) => {
      const parameterResult = result.results?.[0];
      const success = parameterResult?.successful ?? false;
      const reason = parameterResult?.reason ?? '';

      setCollisionParameterUpdating(false);

      if (!success) {
        setResponse({
          success: false,
          message: reason || 'Failed to update collision checking',
        });
        refreshCollisionChecking();
        return;
      }

      setCheckCollisions(enabled);
      setResponse({
        success: true,
        message: `Collision checking ${enabled ? 'enabled' : 'disabled'}`,
      });
    });
  };

  const handleSavePreset = () => {
    if (!ros) {
      alert('ROS is not connected');
      return;
    }

    const name = presetName.trim();

    if (!name) {
      setResponse({ success: false, message: 'Preset name cannot be empty' });
      return;
    }

    const service = new ROSLIB.Service({
      ros,
      name: '/move_group_interface/save_current_pose',
      serviceType: 'interfaces/srv/SaveCurrentPose',
    });

    const request = new ROSLIB.ServiceRequest({
      name,
    });

    service.callService(request, (result: any) => {
      const success = result.success ?? false;
      const message = result.message ?? '';

      setResponse({
        success,
        message,
      });

      if (success) {
        setPresetName('');
        refreshPoseNames(name);
      }
    });
  };

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
      name: '/move_group_interface/go_to_named_pose',
      serviceType: 'interfaces/srv/GoToNamedPose',
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
      <div className="display-row">
        <span>State:</span>
        <strong>{armState ?? 'No data'}</strong>
        <span>Servo Status:</span>
        <strong>{servoStatus ?? 'No data'}</strong>
      </div>

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

      <div className="preset-group">
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSavePreset();
            }
          }}
          placeholder="New preset name"
        />

        <button
          className="save-button"
          onClick={handleSavePreset}
          disabled={!presetName.trim()}
        >
          Save Current Pose
        </button>
      </div>

      <div className="display-row">
        <span>Distance:</span>
        <strong>{getDistanceDisplay()}</strong>
      </div>

      <label className="toggle-row">
        <span>
          Collision Checking
          <small>/servo_node</small>
        </span>

        <input
          type="checkbox"
          checked={checkCollisions}
          onChange={(e) => handleCollisionCheckingChange(e.target.checked)}
          disabled={!collisionParameterLoaded || collisionParameterUpdating}
        />
      </label>

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

        select,
        input {
          padding: 0.5rem;
          border: 1px solid #333;
          border-radius: 4px;
          background: #2b2b2b;
          color: #f1f1f1;
        }

        input::placeholder {
          color: #999;
        }

        .preset-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.75rem;
        }

        .display-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          border: 1px solid #333;
          border-radius: 4px;
          background: #2b2b2b;
        }

        .display-row span {
          color: #ccc;
        }

        .display-row strong {
          color: #f1f1f1;
          font-weight: 600;
        }

        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          border: 1px solid #333;
          border-radius: 4px;
          background: #2b2b2b;
          cursor: pointer;
        }

        .toggle-row span {
          display: flex;
          flex-direction: column;
          color: #ccc;
        }

        .toggle-row small {
          margin-top: 0.15rem;
          color: #888;
          font-size: 0.7rem;
        }

        .toggle-row input {
          width: 1.1rem;
          height: 1.1rem;
          cursor: pointer;
        }

        .toggle-row input:disabled {
          cursor: not-allowed;
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

        .save-button {
          background: #198754;
        }

        .save-button:hover {
          background: #146c43;
        }

        .save-button:disabled {
          background: #555;
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