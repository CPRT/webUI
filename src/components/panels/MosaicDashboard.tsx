'use client';

import React, { useState, ReactElement, useContext, useRef, useEffect, memo } from 'react';
import {
  Mosaic,
  MosaicWindow,
  MosaicNode,
  MosaicPath,
  MosaicContext,
} from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';
import MapView from './MapView';
import WaypointList from './WaypointList';
import SystemTelemetryPanel from './SystemTelemetryPanel';
import OrientationDisplayPanel from './OrientationDisplayPanel';
import GoalSetterPanel from './GoalSetterPanel';
import GasSensor from './GasSensor';
import NetworkHealthTelemetryPanel from './NetworkHealthTelemetryPanel';
import VideoControls from './VideoControls';

type MosaicKey =
  | 'mapView'
  | 'rosMonitor'
  | 'waypointList'
  | 'videoControls'
  | 'gasSensor'
  | 'orientationDisplay'
  | 'goalSetter'
  | 'networkHealthMonitor';

const TILE_DISPLAY_NAMES: Record<MosaicKey, string> = {
  mapView: 'Map View',
  rosMonitor: 'System Telemetry',
  waypointList: 'Waypoint List',
  videoControls: 'Video Stream',
  gasSensor: 'Science',
  orientationDisplay: 'Rover Orientation',
  goalSetter: 'Nav2',
  networkHealthMonitor: 'Connection Health',
};

const ALL_TILES: MosaicKey[] = [
  'mapView',
  'rosMonitor',
  'networkHealthMonitor',
  'orientationDisplay',
  'videoControls',
  'waypointList',
  'gasSensor',
  'goalSetter',
];

type PendingAdd = {
  pathKey: string;
  path: MosaicPath;
  direction: 'row' | 'column';
} | null;


const Controls = memo<{ 
  id: MosaicKey; 
  path: MosaicPath; 
  pendingAdd: PendingAdd;
  setPendingAdd: (value: PendingAdd) => void;
}>(({ id, path, pendingAdd, setPendingAdd }) => {
  const { mosaicActions } = useContext(MosaicContext);
  const pathKey = JSON.stringify(path);
  const showDropdown = pendingAdd?.pathKey === pathKey;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const splitAndAdd = (direction: 'row' | 'column', newTile: MosaicKey) => {
    const splitNode: MosaicNode<MosaicKey> = {
      direction,
      first: id,
      second: newTile,
      splitPercentage: 60,
    };

    mosaicActions.replaceWith(path, splitNode);
    setPendingAdd(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPendingAdd(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, setPendingAdd]);

  return (
    <div ref={dropdownRef} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <button
        className="tile-btn"
        title="Add tile to the right"
        aria-label="Add tile to the right"
        onClick={(e) => {
          e.stopPropagation();
          setPendingAdd({ pathKey, path, direction: 'row' });
        }}
      >
        ➕ (Right)
      </button>

      <button
        className="tile-btn"
        title="Add tile below"
        aria-label="Add tile below"
        onClick={(e) => {
          e.stopPropagation();
          setPendingAdd({ pathKey, path, direction: 'column' });
        }}
      >
        ➕ (Below)
      </button>

      {showDropdown ? (
        <select
          className="tile-select"
          aria-label="Select tile to add"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const value = e.target.value as MosaicKey;
            // Validate pendingAdd state and selected value before proceeding
            if (pendingAdd && value) {
              splitAndAdd(pendingAdd.direction, value);
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Pick tile…
          </option>
          {ALL_TILES.filter((t) => t !== id).map((t) => (
            <option key={t} value={t}>
              {TILE_DISPLAY_NAMES[t]}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
});

Controls.displayName = 'Controls';

const MosaicDashboard: React.FC = () => {
  // TODO: parameterize layout for custom layout configs
  const [mosaicLayout, setMosaicLayout] = useState<MosaicNode<MosaicKey> | null>({
    direction: 'row',
    first: {
      direction: 'column',
      first: 'mapView',
      second: {
        direction: 'row',
        first: {
          direction: 'row',
          first: 'rosMonitor',
          second: 'networkHealthMonitor',
        },
        second: 'orientationDisplay',
        splitPercentage: 55,
      },
      splitPercentage: 55,
    },
    second: {
      direction: 'column',
      first: 'videoControls',
      second: {
        direction: 'row',
        first: 'waypointList',
        second: {
          direction: 'row',
          first: 'gasSensor',
          second: 'goalSetter',
        },
        splitPercentage: 50,
      },
      splitPercentage: 50,
    },
    splitPercentage: 60,
  });

  const [pendingAdd, setPendingAdd] = useState<PendingAdd>(null);

  const renderTile = (id: MosaicKey, path: MosaicPath): ReactElement => {
    switch (id) {
      case 'mapView':
        return (
          <MosaicWindow<MosaicKey>
            title="Map View"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <div style={{ height: '100%', backgroundColor: '#121212' }}>
              <MapView offline />
            </div>
          </MosaicWindow>
        );

      case 'waypointList':
        return (
          <MosaicWindow<MosaicKey>
            title="Waypoint List"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <WaypointList />
          </MosaicWindow>
        );

      case 'videoControls':
        return (
          <MosaicWindow<MosaicKey>
            title="Video Stream"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <VideoControls />
          </MosaicWindow>
        );

      case 'rosMonitor':
        return (
          <MosaicWindow<MosaicKey>
            title="System Telemetry"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <SystemTelemetryPanel />
          </MosaicWindow>
        );

      case 'networkHealthMonitor':
        return (
          <MosaicWindow<MosaicKey>
            title="Connection Health"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <NetworkHealthTelemetryPanel />
          </MosaicWindow>
        );

      case 'orientationDisplay':
        return (
          <MosaicWindow<MosaicKey>
            title="Rover Orientation"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <OrientationDisplayPanel />
          </MosaicWindow>
        );

      case 'gasSensor':
        return (
          <MosaicWindow<MosaicKey>
            title="Science"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <GasSensor />
          </MosaicWindow>
        );

      case 'goalSetter':
        return (
          <MosaicWindow<MosaicKey>
            title="Nav2"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <GoalSetterPanel />
          </MosaicWindow>
        );

      default:
        return (
          <MosaicWindow<MosaicKey>
            title="Unknown tile"
            path={path}
            additionalControls={<Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />}
          >
            <div>Unknown tile</div>
          </MosaicWindow>
        );
    }
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Mosaic<MosaicKey>
        renderTile={renderTile}
        initialValue={mosaicLayout}
        onChange={setMosaicLayout}
        blueprintNamespace="bp5"
      />
      <style jsx global>{`
        .mosaic {
          background-color: #121212;
        }
        .mosaic-window {
          background-color: #1e1e1e;
          color: #f1f1f1;
          border: 1px solid #333;
        }
        .mosaic-window-title {
          background-color: #2d2d2d;
          color: #f1f1f1 !important;
          font-size: 1.25rem;
          border-bottom: 1px solid #444;
        }
        .mosaic-window-body {
          background-color: #1e1e1e;
          color: #f1f1f1;
        }
        .tile-btn {
          background: transparent;
          border: 1px solid #444;
          color: #2d2d2d;
          border-radius: 6px;
          padding: 2px 6px;
          cursor: pointer;
          line-height: 1;
        }
        .tile-btn:hover {
          border-color: #666;
        }
        .tile-select {
          background: #2d2d2d;
          color: #f1f1f1;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 2px 6px;
        }
        .mosaic-window-toolbar .expand-button {
          display: none !important;
        }
        .mosaic-window-toolbar .bp5-button.bp5-icon-more .control-text {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MosaicDashboard;

