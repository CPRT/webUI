'use client';

import { useEffect, useRef, useState } from 'react';

export type CountdownStatus = 'idle' | 'running' | 'finished';

const TICK_INTERVAL_MS = 200;

export interface UseCountdownResult {
  status: CountdownStatus;
  remainingMs: number;
  start: (durationMs: number) => void;
  reset: () => void;
}

//Avoid inaccurate countdowns when switching to the background
export function useCountdown(): UseCountdownResult {
  const [status, setStatus] = useState<CountdownStatus>('idle');
  const [remainingMs, setRemainingMs] = useState(0);
  const endTimeRef = useRef<number | null>(null);

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

  const reset = () => {
    endTimeRef.current = null;
    setRemainingMs(0);
    setStatus('idle');
  };

  return { status, remainingMs, start, reset };
}
