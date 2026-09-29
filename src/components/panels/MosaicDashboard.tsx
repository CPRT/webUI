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
import NetworkHealthTelemetryPanel from './NetworkHealthTelemetryPanel';
import VideoControls from './VideoControls';
import MotorStatusPanel from './MotorStatusPanel';
import NodeStatusPanel from './NodeStatusPanel';
import AntennaControlPanel from './AntennaControlPanel';
import ScienceControlPanel from './ScienceControlPanel';
import ScienceSensorPanel from './ScienceSensorPanel';
import PDBRailsPanel from './PDBRails';
import ArmControlPanel from './ArmControlPanel';
import WebRTCClient from './WebRTCClient';
import TimerPanel from './TimerPanel';
import HeadlightControlPanel from './HeadlightControlPanel';
import MorseTransmissionPanel from './MorseTransmissionPanel';
import RtpStats from './RtpStats';
import TopicEchoPanel from './TopicEchoPanel';
import DriveThrottlePanel from './DriveThrottlePanel';

import { ROVER_IP } from '@/constants';

interface TileDefinition {
  title: string;
  render: () => ReactElement;
}

const TILE_REGISTRY = {
  mapView: {
    title: 'Map View',
    render: () => (
      <div style={{ height: '100%', backgroundColor: '#121212' }}>
        <MapView offline />
      </div>
    ),
  },
  rosMonitor: { title: 'System Telemetry', render: () => <SystemTelemetryPanel /> },
  networkHealthMonitor: { title: 'Connection Health', render: () => <NetworkHealthTelemetryPanel /> },
  orientationDisplay: { title: 'Rover Orientation', render: () => <OrientationDisplayPanel /> },
  videoControls: { title: 'Video Stream', render: () => <VideoControls /> },
  rtpStats: { title: 'RTP Statistics', render: () => <RtpStats /> },
  driveThrottlePanel: { title: 'Drive Throttle', render: () => <DriveThrottlePanel /> },
  waypointList: { title: 'Waypoint List', render: () => <WaypointList /> },
  goalSetter: { title: 'Nav2', render: () => <GoalSetterPanel /> },
  motorStatusPanel: { title: 'Motor Status', render: () => <MotorStatusPanel /> },
  nodeStatusPanel: { title: 'Node Status', render: () => <NodeStatusPanel /> },
  antennaControlPanel: { title: 'Antenna Control', render: () => <AntennaControlPanel /> },
  scienceControlPanel: { title: 'Science Motor Control', render: () => <ScienceControlPanel /> },
  scienceSensorPanel: { title: 'Science Sensor Readouts', render: () => <ScienceSensorPanel /> },
  pdbRails: { title: 'PDB Rails', render: () => <PDBRailsPanel /> },
  armControlPanel: { title: 'Arm Control', render: () => <ArmControlPanel /> },
  webRTCClient: {
    title: 'WebRTC Client',
    render: () => <WebRTCClient config={{ signalingUrl: `ws://${ROVER_IP}:8444` }} />,
  },
  timerPanel: { title: 'Multi-Timer', render: () => <TimerPanel /> },
  headlightControlPanel: { title: 'Headlights', render: () => <HeadlightControlPanel /> },
  morseTransmissionPanel: { title: 'Morse Transmission', render: () => <MorseTransmissionPanel /> },
  echoPanel: { title: 'Topic Echo', render: () => <TopicEchoPanel /> },
} satisfies Record<string, TileDefinition>;

type TileType = keyof typeof TILE_REGISTRY;
type TileId = `${TileType}:${number}`;

// Object.keys preserves insertion order for string keys
const ALL_TILE_TYPES = Object.keys(TILE_REGISTRY) as TileType[];

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

function collectMaxTileNumber(node: MosaicNode<TileId> | null): number {
  if (!node) return 0;

  if (typeof node === 'string') {
    const [, num] = node.split(':');
    return Number(num) || 0;
  }

  return Math.max(collectMaxTileNumber(node.first), collectMaxTileNumber(node.second));
}

function encodeLayout(layout: MosaicNode<TileId> | null): string {
  return encodeURIComponent(JSON.stringify(layout));
}

function decodeLayout(value: string | null): MosaicNode<TileId> | null {
  if (!value) return null;

  try {
    return JSON.parse(decodeURIComponent(value)) as MosaicNode<TileId>;
  } catch {
    return null;
  }
}

function buildDefaultLayout(makeTileId: (type: TileType) => TileId): MosaicNode<TileId> {
  return {
    direction: 'row',
    first: {
      direction: 'column',
      first: makeTileId('mapView'),
      second: {
        direction: 'row',
        first: {
          direction: 'row',
          first: {
            direction: 'column',
            first: makeTileId('antennaControlPanel'),
            second: {
              direction: 'column',
              first: makeTileId('motorStatusPanel'),
              second: makeTileId('nodeStatusPanel'),
              splitPercentage: 50,
            },
            splitPercentage: 35,
          },
          second: makeTileId('networkHealthMonitor'),
        },
        second: makeTileId('waypointList'),
        splitPercentage: 55,
      },
      splitPercentage: 55,
    },
    second: {
      direction: 'column',
      first: makeTileId('videoControls'),
      second: {
        direction: 'row',
        first: makeTileId('pdbRails'),
        second: {
          direction: 'row',
          first: makeTileId('scienceSensorPanel'),
          second: makeTileId('armControlPanel'),
        },
        splitPercentage: 50,
      },
      splitPercentage: 60,
    },
    splitPercentage: 60,
  };
}

const Controls = memo<{
  id: TileId;
  path: MosaicPath;
  pendingAdd: PendingAdd;
  setPendingAdd: (value: PendingAdd) => void;
  makeTileId: (type: TileType) => TileId;
}>(({ id, path, pendingAdd, setPendingAdd, makeTileId }) => {
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
              {TILE_REGISTRY[t].title}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
});

Controls.displayName = 'Controls';

const MosaicDashboard: React.FC = () => {
  const nextTileIdRef = useRef(1);

  const makeTileId = (type: TileType): TileId => {
    const id = `${type}:${nextTileIdRef.current}` as TileId;
    nextTileIdRef.current += 1;
    return id;
  };

  const [mosaicLayout, setMosaicLayout] = useState<MosaicNode<TileId> | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = decodeLayout(params.get('layout'));

    if (fromUrl) {
      nextTileIdRef.current = collectMaxTileNumber(fromUrl) + 1;
      return fromUrl;
    }

    return buildDefaultLayout(makeTileId);
  });

  const [pendingAdd, setPendingAdd] = useState<PendingAdd>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    if (mosaicLayout) {
      params.set('layout', encodeLayout(mosaicLayout));
    } else {
      params.delete('layout');
    }

    const query = params.toString();
    const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', newUrl);
  }, [mosaicLayout]);

  const renderTile = (id: TileId, path: MosaicPath): ReactElement => {
    const type = tileTypeOf(id);

    const controls = (
      <Controls
        id={id}
        path={path}
        pendingAdd={pendingAdd}
        setPendingAdd={setPendingAdd}
        makeTileId={makeTileId}
      />
    );

    const windowProps: {
      title: string;
      path: MosaicPath;
      additionalControls: ReactElement;
    } = {
      title: TILE_REGISTRY[type]?.title ?? type,
      path,
      additionalControls: controls,
    };

    return (
      <MosaicWindow {...windowProps}>
        {TILE_REGISTRY[type]?.render() ?? <div>Unknown tile</div>}
      </MosaicWindow>
    );
  };

  if (!mosaicLayout) return null;

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
