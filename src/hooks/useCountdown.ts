'use client';

import { useEffect, useRef, useState } from 'react';

export type CountdownStatus = 'idle' | 'running' | 'paused' | 'finished';

const TICK_INTERVAL_MS = 200;

export interface UseCountdownResult {
  status: CountdownStatus;
  remainingMs: number;
  start: (durationMs: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

type PersistedCountdown = {
  status: CountdownStatus;
  remainingMs: number;
  endTime: number | null;
};

const persistedCountdowns = new Map<string | number, PersistedCountdown>();

export function clearCountdown(persistKey: string | number): void {
  persistedCountdowns.delete(persistKey);
}

//Avoid inaccurate countdowns when switching to the background
export function useCountdown(persistKey?: string | number): UseCountdownResult {
  const stored = persistKey != null ? persistedCountdowns.get(persistKey) : undefined;
  const [status, setStatus] = useState<CountdownStatus>(stored?.status ?? 'idle');
  const [remainingMs, setRemainingMs] = useState(stored?.remainingMs ?? 0);
  const endTimeRef = useRef<number | null>(stored?.endTime ?? null);

  useEffect(() => {
    if (persistKey == null) return;
    persistedCountdowns.set(persistKey, {
      status,
      remainingMs,
      endTime: endTimeRef.current,
    });
  }, [persistKey, status, remainingMs]);

  useEffect(() => {
    if (status !== 'running') return;

    const tick = () => {
      const remaining = Math.max(0, (endTimeRef.current ?? 0) - Date.now());
      setRemainingMs(remaining);

      if (remaining <= 0) {
        setStatus('finished');
      }
    };

    tick();
    const intervalId = window.setInterval(tick, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [status]);

  const start = (durationMs: number) => {
    endTimeRef.current = Date.now() + durationMs;
    setRemainingMs(durationMs);
    setStatus('running');
  };

  const pause = () => {
    setStatus((prev) => {
      if (prev !== 'running') return prev;
      endTimeRef.current = null;
      return 'paused';
    });
  };

  const resume = () => {
    setStatus((prev) => {
      if (prev !== 'paused') return prev;
      endTimeRef.current = Date.now() + remainingMs;
      return 'running';
    });
  };

  const reset = () => {
    endTimeRef.current = null;
    setRemainingMs(0);
    setStatus('idle');
  };

  return { status, remainingMs, start, pause, resume, reset };
}
