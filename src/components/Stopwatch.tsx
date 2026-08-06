'use client';

import React from 'react';
import { useStopwatch } from '@/hooks/useStopwatch';

function formatStopwatch(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const Stopwatch: React.FC = () => {
  const { status, elapsedMs, start, pause, reset } = useStopwatch();
  const isRunning = status === 'running';

  return (
    <div className="stopwatch">
      <div className="time">{formatStopwatch(elapsedMs)}</div>
      <div className="buttons">
        <button type="button" onClick={isRunning ? pause : start}>
          {isRunning ? 'Stop' : 'Go'}
        </button>
        <button type="button" className="reset" onClick={reset}>
          Reset
        </button>
      </div>

      <style jsx>{`
        .stopwatch {
          position: absolute;
          right: 1rem;
          bottom: 1rem;
          background: linear-gradient(145deg, #2b2b2b, #202020);
          border: 1px solid #3a3a3a;
          border-radius: 14px;
          padding: 1rem 1.25rem;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          gap: 1rem;
          z-index: 1000;
          color: #f1f1f1;
        }

        .time {
          font-family: 'Courier New', monospace;
          font-size: 2.2rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          min-width: 5rem;
          text-align: center;
        }

        .buttons {
          display: flex;
          gap: 0.6rem;
        }

        button {
          padding: 0.55rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 500;
          color: white;
          background: #0070f3;
        }

        button:hover {
          background: #005fcc;
        }

        button.reset {
          background: #555;
        }

        button.reset:hover {
          background: #666;
        }
      `}</style>
    </div>
  );
};

export default Stopwatch;
