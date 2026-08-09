'use client';

import React, { useRef, useState } from 'react';
import TimerCard, { clearTimerCardState } from './TimerCard';
import Stopwatch from '@/components/Stopwatch';

const DEFAULT_COLUMN_NAMES = ['Orders', 'Cooking'];
const DEFAULT_TIMERS_PER_COLUMN = [3, 2];
const MIN_TIMERS_PER_COLUMN = 1;
const MAX_TIMERS_PER_COLUMN = 20;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 10;

type DraggedTimer = {
  timerId: number;
  fromColumnId: number;
};

function smallestFreeId(ids: number[]): number {
  const used = new Set(ids);
  let id = 1;
  while (used.has(id)) id += 1;
  return id;
}

let columnSeq = 0;
function nextColumnId(): number {
  columnSeq += 1;
  return columnSeq;
}

const initialColumns = DEFAULT_COLUMN_NAMES.map((name, i) => ({
  id: nextColumnId(),
  name,
  count: DEFAULT_TIMERS_PER_COLUMN[i] ?? 1,
}));

let idCounter = 0;
const initialTimerIds: Record<number, number[]> = {};
initialColumns.forEach((column) => {
  const ids: number[] = [];
  for (let i = 0; i < column.count; i += 1) {
    idCounter += 1;
    ids.push(idCounter);
  }
  initialTimerIds[column.id] = ids;
});

const TimerPanel: React.FC = () => {
  const [columns, setColumns] = useState(initialColumns.map(({ id, name }) => ({ id, name })));
  const [timerIdsByColumn, setTimerIdsByColumn] = useState<Record<number, number[]>>(initialTimerIds);
  const [labels, setLabels] = useState<Record<number, string>>(() => {
    const all: Record<number, string> = {};
    Object.values(initialTimerIds)
      .flat()
      .forEach((id) => {
        all[id] = `Timer ${id}`;
      });
    return all;
  });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedTimer, setDraggedTimer] = useState<DraggedTimer | null>(null);
  const [timerDragOverColumnId, setTimerDragOverColumnId] = useState<number | null>(null);
  const [timerDragOverTimerId, setTimerDragOverTimerId] = useState<number | null>(null);
  const draggedIndexRef = useRef<number | null>(null);
  const draggedTimerRef = useRef<DraggedTimer | null>(null);

  const addColumn = () => {
    setColumns((prev) => {
      if (prev.length >= MAX_COLUMNS) return prev;
      const id = nextColumnId();
      setTimerIdsByColumn((prevTimers) => ({ ...prevTimers, [id]: [] }));
      return [...prev, { id, name: `Column ${prev.length + 1}` }];
    });
  };

  const removeColumn = (columnId: number) => {
    const idsToClear = timerIdsByColumn[columnId] ?? [];
    idsToClear.forEach(clearTimerCardState);
    setColumns((prev) => {
      if (prev.length <= MIN_COLUMNS) return prev;
      return prev.filter((c) => c.id !== columnId);
    });
    setTimerIdsByColumn((prev) => {
      const next = { ...prev };
      delete next[columnId];
      return next;
    });
    setNotes((prev) => {
      const next = { ...prev };
      delete next[columnId];
      return next;
    });
    setLabels((prev) => {
      const next = { ...prev };
      idsToClear.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  };

  const renameColumn = (columnId: number, name: string) => {
    setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, name } : c)));
  };

  const setNote = (columnId: number, note: string) => {
    setNotes((prev) => ({ ...prev, [columnId]: note }));
  };

  const reorderColumns = (fromIndex: number, toIndex: number) => {
    setColumns((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleColumnDrop = (index: number) => {
    const fromIndex = draggedIndexRef.current;
    if (fromIndex !== null) reorderColumns(fromIndex, index);
    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveTimer = (timerId: number, fromColumnId: number, toColumnId: number, toIndex?: number) => {
    setTimerIdsByColumn((prev) => {
      const sourceIds = prev[fromColumnId] ?? [];
      const fromIndex = sourceIds.indexOf(timerId);
      if (fromIndex === -1) return prev;

      if (fromColumnId === toColumnId) {
        const nextIds = [...sourceIds];
        nextIds.splice(fromIndex, 1);
        let insertAt = toIndex ?? nextIds.length;
        if (toIndex != null && fromIndex < toIndex) insertAt -= 1;
        insertAt = Math.max(0, Math.min(insertAt, nextIds.length));
        if (insertAt === fromIndex) return prev;
        nextIds.splice(insertAt, 0, timerId);
        return { ...prev, [fromColumnId]: nextIds };
      }

      const targetIds = prev[toColumnId] ?? [];
      if (targetIds.length >= MAX_TIMERS_PER_COLUMN) return prev;

      const nextSource = sourceIds.filter((id) => id !== timerId);
      const nextTarget = [...targetIds];
      const insertAt = Math.max(0, Math.min(toIndex ?? nextTarget.length, nextTarget.length));
      nextTarget.splice(insertAt, 0, timerId);

      return { ...prev, [fromColumnId]: nextSource, [toColumnId]: nextTarget };
    });
  };

  const clearTimerDrag = () => {
    draggedTimerRef.current = null;
    setDraggedTimer(null);
    setTimerDragOverColumnId(null);
    setTimerDragOverTimerId(null);
  };

  const handleTimerDropOnColumn = (toColumnId: number) => {
    const active = draggedTimerRef.current;
    if (!active) return;
    moveTimer(active.timerId, active.fromColumnId, toColumnId);
    clearTimerDrag();
  };

  const handleTimerDropOnTimer = (toColumnId: number, beforeTimerId: number) => {
    const active = draggedTimerRef.current;
    if (!active || active.timerId === beforeTimerId) {
      clearTimerDrag();
      return;
    }
    const targetIds = timerIdsByColumn[toColumnId] ?? [];
    const toIndex = targetIds.indexOf(beforeTimerId);
    if (toIndex === -1) {
      clearTimerDrag();
      return;
    }
    moveTimer(active.timerId, active.fromColumnId, toColumnId, toIndex);
    clearTimerDrag();
  };

  const addTimer = (columnId: number) => {
    setTimerIdsByColumn((prev) => {
      const idsInColumn = prev[columnId] ?? [];
      if (idsInColumn.length >= MAX_TIMERS_PER_COLUMN) return prev;
      const allIds = Object.values(prev).flat();
      const id = smallestFreeId(allIds);
      setLabels((prevLabels) => ({ ...prevLabels, [id]: `Timer ${id}` }));
      return { ...prev, [columnId]: [...idsInColumn, id] };
    });
  };

  const removeTimer = (columnId: number, id: number) => {
    const idsInColumn = timerIdsByColumn[columnId] ?? [];
    if (idsInColumn.length <= MIN_TIMERS_PER_COLUMN) return;

    clearTimerCardState(id);
    setTimerIdsByColumn((prev) => ({
      ...prev,
      [columnId]: (prev[columnId] ?? []).filter((t) => t !== id),
    }));
    setLabels((prev) => {
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

      <div
        className="columns-track"
        style={{ gridTemplateColumns: `repeat(${columns.length}, 220px) 140px` }}
      >
        {columns.map((column, index) => {
          const idsInColumn = timerIdsByColumn[column.id] ?? [];
          const columnStyle = index > 0 ? { borderLeft: '1px solid #333', paddingLeft: '1rem' } : undefined;
          const isColumnDragTarget = draggedIndex !== null && draggedIndex !== index;
          const canAcceptTimer =
            draggedTimer !== null &&
            (draggedTimer.fromColumnId === column.id || idsInColumn.length < MAX_TIMERS_PER_COLUMN);
          const isColumnTimerDropHighlight =
            canAcceptTimer && timerDragOverColumnId === column.id && timerDragOverTimerId === null;

          return (
            <React.Fragment key={column.id}>
              <div
                className={`column-timer-cell${isColumnDragTarget && dragOverIndex === index ? ' drag-over' : ''}`}
                style={{ gridColumn: index + 1, gridRow: 1, ...columnStyle }}
                onDragOver={(e) => {
                  if (draggedIndexRef.current !== null && draggedIndexRef.current !== index) {
                    e.preventDefault();
                  }
                }}
                onDragEnter={() => {
                  if (draggedIndexRef.current !== null && draggedIndexRef.current !== index) {
                    setDragOverIndex(index);
                  }
                }}
                onDragLeave={() => {
                  setDragOverIndex((prev) => (prev === index ? null : prev));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndexRef.current !== null) handleColumnDrop(index);
                }}
              >
                <div
                  className="drag-handle"
                  draggable
                  title="Drag to reorder column"
                  aria-label={`Reorder ${column.name}`}
                  onDragStart={(e) => {
                    draggedIndexRef.current = index;
                    setDraggedIndex(index);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', `column:${index}`);
                  }}
                  onDragEnd={() => {
                    draggedIndexRef.current = null;
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                >
                  ⠿
                </div>
                <TimerCard
                  label={column.name}
                  onLabelChange={(name) => renameColumn(column.id, name)}
                  onRemove={columns.length > MIN_COLUMNS ? () => removeColumn(column.id) : undefined}
                  variant="order"
                />
                <textarea
                  className="note-input"
                  value={notes[column.id] ?? ''}
                  placeholder="Add a note…"
                  aria-label={`Note for ${column.name}`}
                  rows={2}
                  onChange={(e) => setNote(column.id, e.target.value)}
                />
              </div>

              <div
                className={`column-content-cell${isColumnTimerDropHighlight ? ' timer-drag-over' : ''}`}
                style={{ gridColumn: index + 1, gridRow: 3, ...columnStyle }}
                onDragOver={(e) => {
                  const activeTimer = draggedTimerRef.current;
                  if (
                    activeTimer &&
                    (activeTimer.fromColumnId === column.id || idsInColumn.length < MAX_TIMERS_PER_COLUMN)
                  ) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  } else if (draggedIndexRef.current !== null && draggedIndexRef.current !== index) {
                    e.preventDefault();
                  }
                }}
                onDragEnter={() => {
                  const activeTimer = draggedTimerRef.current;
                  if (
                    activeTimer &&
                    (activeTimer.fromColumnId === column.id || idsInColumn.length < MAX_TIMERS_PER_COLUMN)
                  ) {
                    setTimerDragOverColumnId(column.id);
                    setTimerDragOverTimerId(null);
                  }
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setTimerDragOverColumnId((prev) => (prev === column.id ? null : prev));
                    setTimerDragOverTimerId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTimerRef.current) {
                    handleTimerDropOnColumn(column.id);
                    return;
                  }
                  if (draggedIndexRef.current !== null) handleColumnDrop(index);
                }}
              >
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => addTimer(column.id)}
                  disabled={idsInColumn.length >= MAX_TIMERS_PER_COLUMN}
                >
                  + Add Timer
                </button>

                <div className="timer-stack">
                  {idsInColumn.map((id) => (
                    <TimerCard
                      key={id}
                      id={id}
                      label={labels[id] ?? `Timer ${id}`}
                      onLabelChange={(label) => renameTimer(id, label)}
                      onRemove={idsInColumn.length > MIN_TIMERS_PER_COLUMN ? () => removeTimer(column.id, id) : undefined}
                      variant="ingredient"
                      draggable
                      isDragOver={draggedTimer?.timerId !== id && timerDragOverTimerId === id}
                      onDragStart={(e) => {
                        const payload: DraggedTimer = { timerId: id, fromColumnId: column.id };
                        draggedTimerRef.current = payload;
                        setDraggedTimer(payload);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', `timer:${id}`);
                      }}
                      onDragEnd={clearTimerDrag}
                      onDragOverCard={(e) => {
                        const activeTimer = draggedTimerRef.current;
                        if (!activeTimer || activeTimer.timerId === id) return;
                        if (
                          activeTimer.fromColumnId !== column.id &&
                          idsInColumn.length >= MAX_TIMERS_PER_COLUMN
                        ) {
                          return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        setTimerDragOverColumnId(column.id);
                        setTimerDragOverTimerId(id);
                      }}
                      onDragLeaveCard={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                          setTimerDragOverTimerId((prev) => (prev === id ? null : prev));
                        }
                      }}
                      onDropOnCard={(e) => {
                        if (!draggedTimerRef.current) return;
                        e.preventDefault();
                        e.stopPropagation();
                        handleTimerDropOnTimer(column.id, id);
                      }}
                    />
                  ))}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div className="column-divider" style={{ gridColumn: `1 / ${columns.length + 1}`, gridRow: 2 }} />

        <button
          type="button"
          className="add-column-btn"
          style={{ gridColumn: columns.length + 1, gridRow: '1 / 4' }}
          onClick={addColumn}
          disabled={columns.length >= MAX_COLUMNS}
        >
          + Add Column
        </button>
      </div>

      <Stopwatch />

      <style jsx>{`
        .panel {
          position: relative;
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

        .columns-track {
          display: grid;
          grid-template-rows: auto 0.9rem 1fr;
          column-gap: 1rem;
          align-items: start;
          flex: 1;
          min-height: 0;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 0.25rem;
        }

        .column-timer-cell {
          min-width: 0;
          border-radius: 8px;
          outline: 2px solid transparent;
          outline-offset: 4px;
          transition: outline-color 0.15s ease;
        }

        .column-timer-cell.drag-over {
          outline-color: #0070f3;
        }

        .drag-handle {
          text-align: center;
          color: #777;
          font-size: 1rem;
          line-height: 1;
          padding: 0.2rem 0 0.35rem;
          cursor: grab;
          user-select: none;
        }

        .drag-handle:hover {
          color: #ccc;
        }

        .note-input {
          margin-top: 0.4rem;
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
          padding: 0.35rem 0.5rem;
          font-size: 1.4rem;
          line-height: 1.4;
          font-family: inherit;
          color: #bbb;
          background: transparent;
          border: 1px solid #333;
          border-radius: 6px;
        }

        .note-input:hover {
          border-color: #444;
        }

        .note-input:focus {
          outline: none;
          background: #111;
          border-color: #0070f3;
          color: #eaeaea;
        }

        .note-input::placeholder {
          color: #666;
        }

        .column-divider {
          align-self: center;
          height: 2px;
          background: #0070f3;
        }

        .column-content-cell {
          display: flex;
          flex-direction: column;
          min-height: 0;
          max-height: 100%;
          min-width: 0;
          border-radius: 8px;
          outline: 2px solid transparent;
          outline-offset: 4px;
          transition: outline-color 0.15s ease;
        }

        .column-content-cell.timer-drag-over {
          outline-color: #0070f3;
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
          white-space: nowrap;
          margin-bottom: 0.75rem;
        }

        .add-btn:hover:enabled {
          background: #005fcc;
        }

        .add-btn:disabled {
          background: #2f2f2f;
          color: #777;
          cursor: not-allowed;
        }

        .timer-stack {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          overflow-y: auto;
          padding-right: 0.25rem;
          min-height: 0;
          flex: 1;
        }

        .add-column-btn {
          height: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px dashed #444;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          font-weight: 500;
          color: #ccc;
          background: transparent;
        }

        .add-column-btn:hover:enabled {
          border-color: #0070f3;
          color: #fff;
        }

        .add-column-btn:disabled {
          color: #555;
          border-color: #333;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TimerPanel;
