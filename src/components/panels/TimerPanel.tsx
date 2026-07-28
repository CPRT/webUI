'use client';

import React, { useState } from 'react';
import TimerCard from './TimerCard';

type TimerGroup = 'orders' | 'other';

const DEFAULT_ORDER_COUNT = 3;
const DEFAULT_OTHER_COUNT = 2;
const MIN_TIMERS_PER_GROUP = 1;
const MAX_TIMERS_PER_GROUP = 20;

const GROUPS: { key: TimerGroup; title: string; addLabel: string }[] = [
  { key: 'orders', title: 'Orders', addLabel: '+ Add Order Timer' },
  { key: 'other', title: 'Cooking', addLabel: '+ Add Timer' },
];

function smallestFreeId(ids: number[]): number {
  const used = new Set(ids);
  let id = 1;
  while (used.has(id)) id += 1;
  return id;
}

const initialOrderIds = Array.from({ length: DEFAULT_ORDER_COUNT }, (_, i) => i + 1);
const initialOtherIds = Array.from(
  { length: DEFAULT_OTHER_COUNT },
  (_, i) => DEFAULT_ORDER_COUNT + i + 1,
);
const initialIds = [...initialOrderIds, ...initialOtherIds];

const TimerPanel: React.FC = () => {
  const [timerIds, setTimerIds] = useState<number[]>(initialIds);
  const [groups, setGroups] = useState<Record<number, TimerGroup>>(() => ({
    ...Object.fromEntries(initialOrderIds.map((id) => [id, 'orders' as TimerGroup])),
    ...Object.fromEntries(initialOtherIds.map((id) => [id, 'other' as TimerGroup])),
  }));
  const [labels, setLabels] = useState<Record<number, string>>(() =>
    Object.fromEntries(initialIds.map((id) => [id, `Timer ${id}`])),
  );

  const addTimer = (group: TimerGroup) => {
    setTimerIds((prev) => {
      const countInGroup = prev.filter((id) => groups[id] === group).length;
      if (countInGroup >= MAX_TIMERS_PER_GROUP) return prev;
      const id = smallestFreeId(prev);
      setLabels((prevLabels) => ({ ...prevLabels, [id]: `Timer ${id}` }));
      setGroups((prevGroups) => ({ ...prevGroups, [id]: group }));
      return [...prev, id].sort((a, b) => a - b);
    });
  };

  const removeTimer = (id: number) => {
    const group = groups[id];
    const countInGroup = timerIds.filter((t) => groups[t] === group).length;
    if (countInGroup <= MIN_TIMERS_PER_GROUP) return;

    setTimerIds((prev) => prev.filter((t) => t !== id));
    setLabels((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setGroups((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const renameTimer = (id: number, label: string) => {
    setLabels((prev) => ({ ...prev, [id]: label }));
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Multi-Timer</h3>
      </div>

      {GROUPS.map(({ key, title, addLabel }) => {
        const idsInGroup = timerIds.filter((id) => groups[id] === key);
        return (
          <div className="timer-section" key={key}>
            <div className="section-header">
              <h4>{title}</h4>
              <button
                type="button"
                className="add-btn"
                onClick={() => addTimer(key)}
                disabled={idsInGroup.length >= MAX_TIMERS_PER_GROUP}
              >
                {addLabel}
              </button>
            </div>

            <div className="timer-grid">
              {idsInGroup.map((id) => (
                <TimerCard
                  key={id}
                  label={labels[id] ?? `Timer ${id}`}
                  onLabelChange={(label) => renameTimer(id, label)}
                  onRemove={idsInGroup.length > MIN_TIMERS_PER_GROUP ? () => removeTimer(id) : undefined}
                />
              ))}
            </div>
          </div>
        );
      })}

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
          border-bottom: 1px solid #444;
          padding-bottom: 0.6rem;
          margin-bottom: 1rem;
        }

        h3 {
          margin: 0;
          font-size: 1.3rem;
          letter-spacing: 0.5px;
        }

        .timer-section {
          display: flex;
          flex-direction: column;
          min-height: 0;
          flex: 1;
        }

        .timer-section + .timer-section {
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid #333;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }

        h4 {
          margin: 0;
          font-size: 0.95rem;
          letter-spacing: 0.4px;
          color: #bbb;
          text-transform: uppercase;
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
