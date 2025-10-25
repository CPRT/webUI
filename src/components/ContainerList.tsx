'use client';
import React, { useEffect, useState, useRef } from 'react';
import ContainerCard, { ContainerOption } from './ContainerCard';
import SetResetPanel from './SetResetPanel';
import Cookies from 'js-cookie';

const DEFAULT_API_BASE = 'http://localhost:8080';

const ContainerList: React.FC = () => {
  const [options, setOptions] = useState<ContainerOption[]>([]);
  const [eventMsgs, setEventMsgs] = useState<Record<string, string | null>>({});
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const savedApiBase = Cookies.get('launch_server_url');
    if (savedApiBase) {
      setApiBase(savedApiBase);
    }
  }, []);

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${apiBase}/options`);
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
    const source = new EventSource(`${apiBase}/events`);
    sseRef.current = source;

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data.event || !data.container) {
          console.warn('Unknown event data');
          return;
        }

        const key = data.container.replace(/-instance$/, '');

        if (data.event === 'exit') {
          setEventMsgs((prev) => ({
            ...prev,
            [key]: `Exited with code ${data.code} at ${data.timestamp}`,
          }));
          fetchOptions();
        } else if (data.event === 'stopping') {
          setEventMsgs((prev) => ({
            ...prev,
            [key]: 'Stopping...',
          }));
        } else if (data.event === 'starting') {
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
    };

    return () => {
      source.close();
    };
  }, [apiBase]);

  const startContainer = async (key: string) => {
    await fetch(`${apiBase}/start/${key}`, { method: 'POST' });
    await fetchOptions();
    setEventMsgs((prev) => ({ ...prev, [key]: null }));
  };

  const stopContainer = async (key: string | null) => {
    if (!key) return;
    await fetch(`${apiBase}/stop/${key}`, { method: 'POST' });
    await fetchOptions();
    setEventMsgs((prev) => ({ ...prev, [key]: null }));
  };

  const handleUrlChange = (url: string) => {
    setApiBase(url);
  };

  const handleReset = () => {
    Cookies.remove('launch_server_url');
    setApiBase(DEFAULT_API_BASE);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Docker Launch Options</h2>
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
        <SetResetPanel
          id="launch_server_url"
          defaultUrl={DEFAULT_API_BASE}
          onUrlChange={handleUrlChange}
          onReset={handleReset}
        />
      </div>
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
