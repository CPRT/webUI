'use client';

import React, { useState } from 'react';
import TimerCard from './TimerCard';

const DEFAULT_TIMER_COUNT = 5;
const MIN_TIMERS = 1;
const MAX_TIMERS = 8;

function smallestFreeId(ids: number[]): number {
  const used = new Set(ids);
  let id = 1;
  while (used.has(id)) id += 1;
  return id;
}

const TimerPanel: React.FC = () => {
  const [timerIds, setTimerIds] = useState<number[]>(
    Array.from({ length: DEFAULT_TIMER_COUNT }, (_, i) => i + 1),
  );

  const addTimer = () => {
    setTimerIds((prev) => {
      if (prev.length >= MAX_TIMERS) return prev;
      const id = smallestFreeId(prev);
      return [...prev, id].sort((a, b) => a - b);
    });
  };

  const removeTimer = (id: number) => {
    setTimerIds((prev) => (prev.length > MIN_TIMERS ? prev.filter((t) => t !== id) : prev));
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Multi-Timer</h3>
        <button
          type="button"
          className="add-btn"
          onClick={addTimer}
          disabled={timerIds.length >= MAX_TIMERS}
        >
          + Add Timer
        </button>
      </div>

      <div className="timer-grid">
        {timerIds.map((id) => (
          <TimerCard
            key={id}
            label={`Timer ${id}`}
            onRemove={timerIds.length > MIN_TIMERS ? () => removeTimer(id) : undefined}
          />
        ))}
      </div>

      <style jsx>{`
        .panel {
          background: radial-gradient(circle at top, #2a2a2a, #151515);
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 12px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #444;
          padding-bottom: 0.6rem;
          margin-bottom: 1rem;
        }

        h3 {
          margin: 0;
          font-size: 1.3rem;
          letter-spacing: 0.5px;
        }

        .add-btn {
          padding: 0.4rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 500;
          color: white;
          background: #0070f3;
        }

        .add-btn:hover:enabled {
          background: #005fcc;
        }

        .add-btn:disabled {
          background: #2f2f2f;
          color: #777;
          cursor: not-allowed;
        }

        .timer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          overflow-y: auto;
          padding-right: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default TimerPanel;
