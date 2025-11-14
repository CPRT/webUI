'use client';
import React, { useEffect, useState, useRef } from 'react';
import ContainerCard, { ContainerOption } from './ContainerCard';
import SetResetPanel from './SetResetPanel';
import toast from "react-hot-toast";


const dockersToPull = [
  'cprtsoftware/rover:arm64',
  'cprtsoftware/web-ui:latest',
  'cprtsoftware/container-launcher:latest',
];

const DEFAULT_API_BASE = 'http://localhost:8080';

const ContainerList: React.FC = () => {
  const [options, setOptions] = useState<ContainerOption[]>([]);
  const [eventMsgs, setEventMsgs] = useState<Record<string, string | null>>({});
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const sseRef = useRef<EventSource | null>(null);

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

  const handlePull = async () => {
    const ok = confirm(
      `This updates the rover to the latest merged version. Are you sure you want to continue?`
    );
    if (!ok) return;

    const promises = dockersToPull.map(async (docker) => {
      const id = toast.loading(`Pulling ${docker}…`);

      try {
        const encoded = encodeURIComponent(docker);
        const res = await fetch(`${apiBase}/pull/${encoded}`, { method: "PUT" });
        const data = await res.json();

        if (res.ok) {
          toast.success(`Pulled ${docker} successfully`, { id });
        } else {
          toast.error(`Failed to pull ${docker}: ${data?.error}`, { id });
        }
      } catch (err: any) {
        toast.error(`Error pulling ${docker}: ${err.message}`, { id });
      }
    });

    await Promise.all(promises);
    toast("All pulls finished");
  };


  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Docker Launch Options</h2>
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
        <SetResetPanel
          id="launch_server_url"
          defaultUrl={DEFAULT_API_BASE}
          onUrlChange={handleUrlChange}
          onReset={handlePull}
          button2Name='Update system'
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(300px, 100%, 700px), 1fr))',
          gap: 16,
          alignItems: 'start',
        }}>
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
    </div>
  );
};

export default ContainerList;
