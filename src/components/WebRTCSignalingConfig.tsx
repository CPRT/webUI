'use client';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface WebRTCSignalingConfigProps {
  onUrlChange: (url: string) => void;
  onReset: () => void;
}

const WebRTCSignalingConfig: React.FC<WebRTCSignalingConfigProps> = ({ onUrlChange, onReset }) => {
  const [url, setUrl] = useState('ws://localhost:8443');

  useEffect(() => {
    const savedUrl = Cookies.get('signaling_server_url');
    if (savedUrl) {
      setUrl(savedUrl);
      onUrlChange(savedUrl);
    }
  }, [onUrlChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSave = () => {
    Cookies.set('signaling_server_url', url);
    onUrlChange(url);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        background: '#f9f9f9',
        borderRadius: '0.75rem',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
      }}
    >
      <input
        type="text"
        value={url}
        onChange={handleChange}
        placeholder="ws://localhost:8443"
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          border: '1px solid #ddd',
          borderRadius: '0.5rem',
          fontSize: '0.95rem',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#0070f3')}
        onBlur={(e) => (e.target.style.borderColor = '#ddd')}
      />
      <button
        onClick={handleSave}
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.95rem',
          transition: 'background-color 0.2s, transform 0.1s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#005bb5')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0070f3')}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Set Server
      </button>
      <button
        onClick={onReset}
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#dc3545',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.95rem',
          transition: 'background-color 0.2s, transform 0.1s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#A03232')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Reset
      </button>
    </div>
  );
};

export default WebRTCSignalingConfig;
