import React, { useEffect, useState, useRef } from 'react';
import ContainerCard, { ContainerOption } from './ContainerCard';
import { useEnvContext } from 'next-runtime-env';

const ContainerList: React.FC = () => {
  const [options, setOptions] = useState<ContainerOption[]>([]);
  const [eventMsgs, setEventMsgs] = useState<Record<string, string | null>>({});
  const sseRef = useRef<EventSource | null>(null);

  const { NEXT_PUBLIC_LAUNCHSERVER } = useEnvContext();
  const API_BASE = NEXT_PUBLIC_LAUNCHSERVER ? `http://${NEXT_PUBLIC_LAUNCHSERVER}` : 'http://localhost:8080';

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/options`);
      const data: ContainerOption[] = await res.json();
      setOptions(data);

      // Initialize event messages map keys to null if not present
      setEventMsgs((prev) => {
        const updated = { ...prev };
        data.forEach(({ key }) => {
          if (!(key in updated)) updated[key] = null;
        });
        return updated;
      });
    } catch (err) {
      console.error('Failed to fetch options', err);
    }
  };

  useEffect(() => {
    fetchOptions();

    // Setup single SSE connection
    const source = new EventSource(`${API_BASE}/events`);
    sseRef.current = source;

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data.event || !data.container) {
          console.warn('Unknown event data');
          return;
        }
        if (data.event === 'exit') {
          // Extract key from container name like "key-instance"
          const key = data.container.replace(/-instance$/, '');
          setEventMsgs((prev) => ({
            ...prev,
            [key]: `Exited with code ${data.code} at ${data.timestamp}`,
          }));
          // Optionally update options state to reflect stopped status here, or refetch
          fetchOptions();
        } else if (data.event === 'stopping') {
          const key = data.container.replace(/-instance$/, '');
          setEventMsgs((prev) => ({
            ...prev,
            [key]: 'Stopping...',
          }));
        } else if (data.event === 'starting') {
          const key = data.container.replace(/-instance$/, '');
          setEventMsgs((prev) => ({
            ...prev,
            [key]: 'Started...',
          }));
          fetchOptions();
        }
      } catch (err) {
        console.warn('Failed to parse SSE event', err);
      }
    };

    source.onerror = () => {
      console.error('SSE connection error');
      source.close();
      // Optionally implement reconnect logic here
    };

    return () => {
      source.close();
    };
  }, [API_BASE]);

  const startContainer = async (key: string) => {
    await fetch(`${API_BASE}/start/${key}`, { method: 'POST' });
    await fetchOptions();
    setEventMsgs((prev) => ({ ...prev, [key]: null }));
  };

  const stopContainer = async (key: string | null) => {
    if (!key) return;
    await fetch(`${API_BASE}/stop/${key}`, { method: 'POST' });
    await fetchOptions();
    setEventMsgs((prev) => ({ ...prev, [key]: null }));
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Docker Launch Options</h2>
      {options.map((opt) => (
        <ContainerCard
          key={opt.key}
          option={opt}
          onStart={startContainer}
          onStop={stopContainer}
          eventMsg={eventMsgs[opt.key] || null}
        />
      ))}
    </div>
  );
};

export default ContainerList;
