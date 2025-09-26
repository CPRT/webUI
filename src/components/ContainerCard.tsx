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
  onStop: (id: string | null) => Promise<void>;
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  option,
  onStart,
  onStop,
}) => {
  const { key, description, image, startTime, id, logsWsUrl } = option;
  const [statusState, setStatusState] = useState<'running' | 'stopped'>(option.status);
  const [logs, setLogs] = useState<string[]>([]);
  const [eventMsg, setEventMsg] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const logBoxRef = useRef<HTMLPreElement>(null);

  // Sync status and clear logs/eventMsg when container ID changes (new container after restart)
  useEffect(() => {
    setStatusState(option.status);
    setLogs([]);
    setEventMsg(null);
  }, [option.id]);

  const handleStart = async () => {
    await onStart(key);
    // logs and eventMsg cleared by above effect on id change
  };

  // 🟢 Connect WebSocket logs when running and logsWsUrl changes
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

  // 🔵 Connect SSE for exit events on container ID or key change
  useEffect(() => {
    if (id) {
      const { NEXT_PUBLIC_LAUNCHSERVER } = useEnvContext();
      const apiBase = NEXT_PUBLIC_LAUNCHSERVER || 'http://localhost:8080';
      const source = new EventSource(`${apiBase}/events/${key}`);
      sseRef.current = source;

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEventMsg(`Exited with code ${data.code} at ${data.timestamp}`);
          setStatusState('stopped');
        } catch (err) {
          console.warn('Failed to parse SSE event', err);
        }
      };

      return () => {
        source.close();
      };
    }
  }, [id, key]);

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
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => onStop(id)}
              style={{
                fontSize: '16px',
                padding: '10px 20px',
                cursor: 'pointer',
              }}
            >
              Stop
            </button>
          </div>
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
  
      {statusState === 'running' && (
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
 