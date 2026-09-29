'use client';

import { useEffect, useRef, useState } from 'react';

export type StopwatchStatus = 'idle' | 'running' | 'paused';

const TICK_INTERVAL_MS = 200;

export interface UseStopwatchResult {
  status: StopwatchStatus;
  elapsedMs: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useStopwatch(): UseStopwatchResult {
  const [status, setStatus] = useState<StopwatchStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const baseElapsedRef = useRef(0);

  useEffect(() => {
    if (status !== 'running') return;

    const tick = () => {
      const now = Date.now();
      setElapsedMs(baseElapsedRef.current + (now - (startTimeRef.current ?? now)));
    };

    tick();
    const intervalId = window.setInterval(tick, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [status]);

  const start = () => {
    startTimeRef.current = Date.now();
    setStatus('running');
  };

  const pause = () => {
    setStatus((prev) => {
      if (prev !== 'running') return prev;
      baseElapsedRef.current += Date.now() - (startTimeRef.current ?? Date.now());
      startTimeRef.current = null;
      return 'paused';
    });
  };

  const reset = () => {
    startTimeRef.current = null;
    baseElapsedRef.current = 0;
    setElapsedMs(0);
    setStatus('idle');
  };

  return { status, elapsedMs, start, pause, reset };
}
