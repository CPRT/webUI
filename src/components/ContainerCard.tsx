import React, { useEffect, useRef, useState } from 'react';
import { useEnvContext } from 'next-runtime-env';



export interface ContainerOption {
  key: string;
  description: string;
  image: string;
  status: 'running' | 'stopped';
  startTime: string | null;
  id: string | null;
  logsWsUrl: string | null;
}

export interface ContainerCardProps {
  option: ContainerOption;
  onStart: (key: string) => Promise<void>;
  onStop: (key: string | null) => Promise<void>;
  eventMsg?: string | null;
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  option,
  onStart,
  onStop,
  eventMsg: externalEventMsg = null,
}) => {
  const { key, description, image, startTime, id, logsWsUrl } = option;
  const [statusState, setStatusState] = useState<'running' | 'stopping' | 'stopped'>(option.status);
  const [logs, setLogs] = useState<string[]>([]);
  const [eventMsg, setEventMsg] = useState<string | null>(externalEventMsg);
  const socketRef = useRef<WebSocket | null>(null);
  const logBoxRef = useRef<HTMLPreElement>(null);
  const { NEXT_PUBLIC_LAUNCHSERVER } = useEnvContext();
  const apiBase = NEXT_PUBLIC_LAUNCHSERVER || 'localhost:8080';

  // Sync status and clear logs/eventMsg when container ID changes (new container after restart)
  useEffect(() => {
    setStatusState(option.status);
    setLogs([]);
    setEventMsg(externalEventMsg);
  }, [option.id, externalEventMsg, option.status]);

  const handleStart = async () => {
    await onStart(key);
  };

  // Connect WebSocket logs when running and logsWsUrl changes
  useEffect(() => {
    if (statusState === 'running' && logsWsUrl) {
      const socket = new WebSocket(logsWsUrl);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        setLogs((prev) => [...prev.slice(-100), event.data]);
      };

      return () => {
        socket.close();
      };
    }
  }, [logsWsUrl, statusState]);

  // Auto-scroll logs when new logs arrive
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
        background: statusState === 'running' ? '#e6ffe6' : '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>{key}</h3>
  
        {statusState === 'stopped' ? (
          <button
            onClick={handleStart}
            style={{
              fontSize: '16px',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Start
          </button>
        ) : (
          <button
            onClick={() => onStop(key)}
            style={{
              fontSize: '16px',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Stop
          </button>
        )}
      </div>
  
      <p style={{ fontStyle: 'italic' }}>{description}</p>
      <p>
        <strong>Image:</strong> {image}
      </p>
      <p>
        <strong>Status:</strong>{' '}
        <span style={{ color: statusState === 'running' ? 'green' : 'red' }}>{statusState}</span>
      </p>
      {startTime && (
        <p>
          <strong>Started at:</strong> {new Date(startTime).toLocaleString()}
        </p>
      )}
      {eventMsg && (
        <p style={{ color: 'orange' }}>
          <strong>Event:</strong> {eventMsg}
        </p>
      )}
  
      {statusState !== 'stopped' && (
        <div style={{ marginTop: 12 }}>
          <strong>Live Logs:</strong>
          <pre
            ref={logBoxRef}
            style={{
              backgroundColor: '#111',
              color: '#0f0',
              padding: 10,
              borderRadius: 4,
              height: 150,
              overflowY: 'auto',
              marginTop: 4,
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {logs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ContainerCard;
