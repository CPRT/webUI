'use client';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useROS } from '@/ros/ROSContext';

const ConnectionStatusDisplay: React.FC = () => {
  const { connectionStatus, connect, disconnect } = useROS();
  const [url, setUrl] = useState('ws://localhost:9090');

  // Load url from cookie on mount
  useEffect(() => {
    const savedUrl = Cookies.get('rosbridge_url')?.trim();
    if (savedUrl) {
      setUrl(savedUrl);
      connect(savedUrl);
    }
  }, []);

  useEffect(() => {
    Cookies.set('rosbridge_url', url, { expires: 1 });
  }, [url]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'green';
      case 'connecting':
        return 'yellow';
      case 'error':
        return 'orange';
      case 'disconnected':
      default:
        return 'red';
    }
  };

  const handleConnect = () => {
    if (url.trim()) {
      connect(url.trim());
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="connection-status">
      <div className="indicator" style={{ backgroundColor: getStatusColor() }} />
      <span className="status-text">{connectionStatus}</span>
      <input
        type="text"
        placeholder="Enter ROS IP (ws://...)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleConnect();
        }}
      />
      <button onClick={handleConnect}>Connect</button>
      {connectionStatus === 'connected' && (
        <button onClick={handleDisconnect}>Disconnect</button>
      )}
      <style jsx>{`
        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .status-text {
          font-weight: bold;
          text-transform: capitalize;
        }
        input {
          padding: 0.25rem 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 0.25rem 0.75rem;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #005bb5;
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatusDisplay;
