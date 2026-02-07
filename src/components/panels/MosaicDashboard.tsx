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
import MotorStatusPanel from './MotorStatusPanel';
import { v4 as uuidv4 } from 'uuid';
import AntennaControlPanel from './AntennaControlPanel';

type TileType =
  | 'mapView'
  | 'rosMonitor'
  | 'waypointList'
  | 'videoControls'
  | 'gasSensor'
  | 'orientationDisplay'
  | 'goalSetter'
  | 'networkHealthMonitor'
  | 'MotorStatusPanel'
  | 'antennaControlPanel';

type TileId = `${TileType}:${string}`;

const TILE_DISPLAY_NAMES: Record<TileType, string> = {
  mapView: 'Map View',
  rosMonitor: 'System Telemetry',
  waypointList: 'Waypoint List',
  videoControls: 'Video Stream',
  gasSensor: 'Science',
  orientationDisplay: 'Rover Orientation',
  goalSetter: 'Nav2',
  networkHealthMonitor: 'Connection Health',
  MotorStatusPanel: 'motor',
  antennaControlPanel: 'Antenna Control',
};

const ALL_TILE_TYPES: TileType[] = [
  'mapView',
  'rosMonitor',
  'networkHealthMonitor',
  'orientationDisplay',
  'videoControls',
  'waypointList',
  'gasSensor',
  'goalSetter',
  'MotorStatusPanel',
  'antennaControlPanel',
];

function makeTileId(type: TileType): TileId {
  const uid = uuidv4();
  return `${type}:${uid}`;
}

function tileTypeOf(id: TileId): TileType {
  return id.split(':', 1)[0] as TileType;
}

type PendingAdd =
  | {
      pathKey: string;
      path: MosaicPath;
      direction: 'row' | 'column';
    }
  | null;

const Controls = memo<{
  id: TileId;
  path: MosaicPath;
  pendingAdd: PendingAdd;
  setPendingAdd: (value: PendingAdd) => void;
}>(({ id, path, pendingAdd, setPendingAdd }) => {
  const { mosaicActions } = useContext(MosaicContext);
  const pathKey = JSON.stringify(path);
  const showDropdown = pendingAdd?.pathKey === pathKey;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const splitAndAdd = (direction: 'row' | 'column', newType: TileType) => {

    const newId = makeTileId(newType);

    const splitNode: MosaicNode<TileId> = {
      direction,
      first: id,
      second: newId,
      splitPercentage: 60,
    };

    mosaicActions.replaceWith(path, splitNode);
    setPendingAdd(null);
  };

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

  const currentType = tileTypeOf(id);

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
            const value = e.target.value as TileType;
            if (pendingAdd && value) {
              splitAndAdd(pendingAdd.direction, value);
              e.target.value = '';
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Pick tile…
          </option>
          {ALL_TILE_TYPES.map((t) => (
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
  const [mosaicLayout, setMosaicLayout] = useState<MosaicNode<TileId> | null>({
    direction: 'row',
    first: {
      direction: 'column',
      first: makeTileId('mapView'),
      second: {
        direction: 'row',
        first: {
          direction: 'row',
          first: makeTileId('rosMonitor'),
          second: makeTileId('networkHealthMonitor'),
        },
        second: makeTileId('orientationDisplay'),
        splitPercentage: 55,
      },
      splitPercentage: 55,
    },
    second: {
      direction: 'column',
      first: makeTileId('videoControls'),
      second: {
        direction: 'row',
        first: makeTileId('waypointList'),
        second: {
          direction: 'row',
          first: makeTileId('gasSensor'),
          second: makeTileId('goalSetter'),
        },
        splitPercentage: 50,
      },
      splitPercentage: 50,
    },
    splitPercentage: 60,
  });

  const [pendingAdd, setPendingAdd] = useState<PendingAdd>(null);

  const renderTile = (id: TileId, path: MosaicPath): ReactElement => {
    const type = tileTypeOf(id);
    switch (type) {
      case 'mapView':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <div style={{ height: '100%', backgroundColor: '#121212' }}>
              <MapView offline />
            </div>
          </MosaicWindow>
        );

      case 'waypointList':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <WaypointList />
          </MosaicWindow>
        );

      case 'videoControls':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <VideoControls />
          </MosaicWindow>
        );

      case 'rosMonitor':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <SystemTelemetryPanel />
          </MosaicWindow>
        );

      case 'networkHealthMonitor':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <NetworkHealthTelemetryPanel />
          </MosaicWindow>
        );

      case 'orientationDisplay':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <OrientationDisplayPanel />
          </MosaicWindow>
        );

      case 'gasSensor':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <GasSensor />
          </MosaicWindow>
        );

      case 'goalSetter':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <GoalSetterPanel />
          </MosaicWindow>
        );
      case 'MotorStatusPanel':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <MotorStatusPanel />
          </MosaicWindow>
        );
      case 'antennaControlPanel':
        return (
          <MosaicWindow<TileId>
            title={TILE_DISPLAY_NAMES[type]}
            path={path}
            additionalControls={
              <Controls id={id} path={path} pendingAdd={pendingAdd} setPendingAdd={setPendingAdd} />
            }
          >
            <AntennaControlPanel />
          </MosaicWindow>
        );

      default:
        return <div>Unknown tile</div>;
    }
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Mosaic<TileId>
        value={mosaicLayout}
        onChange={setMosaicLayout}
        renderTile={renderTile}
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

