'use client';

import React, { useState } from 'react';
import { useCountdown } from '@/hooks/useCountdown';

const DEFAULT_PRESET_MS = 4 * 60 * 1000;

function formatMmSs(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseMmSs(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (seconds > 59) return null;

  const totalMs = (minutes * 60 + seconds) * 1000;
  return totalMs > 0 ? totalMs : null;
}

interface TimerCardProps {
  label: string;
  onLabelChange?: (label: string) => void;
  onRemove?: () => void;
}

const TimerCard: React.FC<TimerCardProps> = ({ label, onLabelChange, onRemove }) => {
  const { status, remainingMs, start, pause, resume, reset } = useCountdown();

  const [presetMs, setPresetMs] = useState(DEFAULT_PRESET_MS);
  const [inputText, setInputText] = useState(formatMmSs(DEFAULT_PRESET_MS));
  const [inputInvalid, setInputInvalid] = useState(false);

  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isFinished = status === 'finished';

  const countdownColor = isFinished
    ? '#ff5566'
    : remainingMs <= 30 * 1000
      ? '#ff5566'
      : remainingMs <= 60 * 1000
        ? '#ffcc00'
        : '#00ffcc';

  const handleGo = () => {
    const parsedMs = parseMmSs(inputText);
    if (parsedMs === null) {
      setInputInvalid(true);
      return;
    }

    setInputInvalid(false);
    setPresetMs(parsedMs);
    start(parsedMs);
  };

  const handleReset = () => {
    reset();
    setInputText(formatMmSs(presetMs));
    setInputInvalid(false);
  };

  return (
    <div className={`timer-card${isFinished ? ' finished' : ''}`}>
      <div className="header">
        <input
          type="text"
          className="label-input"
          value={label}
          aria-label="Timer name"
          onChange={(e) => onLabelChange?.(e.target.value)}
        />
        {onRemove && (
          <button
            type="button"
            className="remove-btn"
            onClick={onRemove}
            title="Remove timer"
            aria-label={`Remove ${label}`}
          >
            ×
          </button>
        )}
      </div>

      {!isIdle && <div className="countdown">{formatMmSs(remainingMs)}</div>}

      <input
        type="text"
        inputMode="numeric"
        value={isIdle ? inputText : formatMmSs(presetMs)}
        disabled={!isIdle}
        placeholder="mm:ss"
        className={inputInvalid ? 'invalid' : ''}
        onChange={(e) => {
          setInputText(e.target.value);
          setInputInvalid(false);
        }}
      />

      <div className="buttons">
        {isIdle && (
          <button type="button" onClick={handleGo}>
            Go
          </button>
        )}
        {isRunning && (
          <button type="button" className="pause" onClick={pause}>
            Pause
          </button>
        )}
        {isPaused && (
          <button type="button" onClick={resume}>
            Resume
          </button>
        )}
        {!isIdle && (
          <button type="button" className="reset" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>

      <style jsx>{`
        .timer-card {
          background: linear-gradient(145deg, #2b2b2b, #202020);
          border: 1px solid #3a3a3a;
          border-radius: 10px;
          padding: 0.75rem;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .timer-card.finished {
          border-color: #dc3545;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 6px rgba(220, 53, 69, 0.4);
          }
          50% {
            box-shadow: 0 0 16px rgba(220, 53, 69, 0.9);
          }
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label-input {
          margin: 0;
          padding: 0.15rem 0.3rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #eaeaea;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          width: 100%;
          min-width: 0;
          font-family: inherit;
        }

        .label-input:hover {
          border-color: #444;
        }

        .label-input:focus {
          outline: none;
          background: #111;
          border-color: #0070f3;
        }

        .remove-btn {
          background: transparent;
          border: none;
          color: #888;
          font-size: 1rem;
          line-height: 1;
          padding: 0 0.25rem;
          cursor: pointer;
        }

        .remove-btn:hover {
          color: #dc3545;
        }

        .countdown {
          font-family: 'Courier New', monospace;
          font-size: 1.8rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 1px;
          color: ${countdownColor};
          transition: color 0.2s ease;
        }

        input {
          padding: 0.35rem;
          border-radius: 6px;
          border: 1px solid #444;
          background: #111;
          color: #fff;
          font-size: 0.85rem;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
          font-family: 'Courier New', monospace;
        }

        input:disabled {
          color: #999;
          cursor: not-allowed;
        }

        input.invalid {
          border-color: #dc3545;
        }

        input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 5px rgba(0, 112, 243, 0.4);
        }

        .buttons {
          display: flex;
        }

        button {
          flex: 1;
          padding: 0.4rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 500;
          transition: 0.15s ease;
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

        button.pause {
          background: #d9a441;
        }

        button.pause:hover {
          background: #c4923a;
        }
      `}</style>
    </div>
  );
};

export default TimerCard;
