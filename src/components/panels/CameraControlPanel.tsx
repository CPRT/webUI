'use client';

import { useEffect, useState } from 'react';

type ControlType = 'int' | 'bool' | 'menu';

interface CameraControl {
  name: string;
  type: ControlType;
  value: number;
  min?: number;
  max?: number;
  menuLabel?: string;
}

interface Camera {
  name: string;
  controls: CameraControl[];
}

const DEMO_CAMERAS: Camera[] = [
  {
    name: 'Front Camera',
    controls: [
      { name: 'Brightness', type: 'int', value: 128, min: 0, max: 255 },
      { name: 'Contrast', type: 'int', value: 32, min: 0, max: 255 },
      { name: 'Saturation', type: 'int', value: 64, min: 0, max: 255 },
      { name: 'Hue', type: 'int', value: 0, min: -180, max: 180 },
      { name: 'Gain', type: 'int', value: 15, min: 0, max: 100 },
      { name: 'Sharpness', type: 'int', value: 5, min: 0, max: 10 },
      { name: 'Gamma', type: 'int', value: 100, min: 50, max: 300 },
      { name: 'Auto Exposure', type: 'bool', value: 1 },
      {
        name: 'Power Line Frequency',
        type: 'menu',
        value: 1,
        min: 0,
        max: 2,
        menuLabel: '60 Hz',
      },
    ],
  },
  {
    name: 'Rear Camera',
    controls: [
      { name: 'Brightness', type: 'int', value: 96, min: 0, max: 255 },
      { name: 'Contrast', type: 'int', value: 40, min: 0, max: 255 },
      { name: 'Gain', type: 'int', value: 10, min: 0, max: 100 },
      { name: 'Auto Exposure', type: 'bool', value: 0 },
    ],
  },
];

export default function CameraControlPanel() {
  const [camera, setCamera] = useState(DEMO_CAMERAS[0].name);
  const [controls, setControls] = useState<CameraControl[]>([]);

  useEffect(() => {
    const selected = DEMO_CAMERAS.find((c) => c.name === camera);

    if (selected) {
      setControls(selected.controls.map((c) => ({ ...c })));
    }
  }, [camera]);

  const updateControl = (index: number, value: number) => {
    setControls((prev) =>
      prev.map((control, i) =>
        i === index
          ? {
              ...control,
              value,
            }
          : control
      )
    );
  };

  const refreshSettings = () => {
    console.log('TODO: Refresh from ROS');
  };

  const applySettings = () => {
    console.log('TODO: Publish to ROS');
    console.log(camera);
    console.table(controls);
  };

  const savePreset = () => {
    console.log('TODO: Save preset');
  };

  const loadPreset = () => {
    console.log('TODO: Load preset');
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        color: '#f1f1f1',
        padding: 16,
        boxSizing: 'border-box',
        gap: 16,
      }}
    >
      <select
        value={camera}
        onChange={(e) => setCamera(e.target.value)}
        style={{
          background: '#2d2d2d',
          color: '#fff',
          border: '1px solid #444',
          borderRadius: 6,
          padding: 8,
          fontSize: 14,
        }}
      >
        {DEMO_CAMERAS.map((cam) => (
          <option key={cam.name} value={cam.name}>
            {cam.name}
          </option>
        ))}
      </select>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 6,
        }}
      >
        {controls.map((control, index) => (
          <div
            key={control.name}
            style={{
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 14,
              }}
            >
              <strong>{control.name}</strong>

              <span>
                {control.type === 'bool'
                  ? control.value
                    ? 'Enabled'
                    : 'Disabled'
                  : control.type === 'menu'
                  ? control.menuLabel
                  : control.value}
              </span>
            </div>

            {control.type === 'bool' ? (
              <input
                type="checkbox"
                checked={control.value === 1}
                onChange={(e) =>
                  updateControl(index, e.target.checked ? 1 : 0)
                }
              />
            ) : (
              <input
                type="range"
                min={control.min}
                max={control.max}
                value={control.value}
                onChange={(e) =>
                  updateControl(index, Number(e.target.value))
                }
                style={{
                  width: '100%',
                  accentColor: '#4f8cff',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        <button className="tile-btn" onClick={refreshSettings}>
          Refresh
        </button>

        <button className="tile-btn" onClick={applySettings}>
          Apply
        </button>

        <button className="tile-btn" onClick={savePreset}>
          Save Preset
        </button>

        <button className="tile-btn" onClick={loadPreset}>
          Load Preset
        </button>
      </div>
    </div>
  );
}