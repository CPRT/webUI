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
import AntennaControlPanel from './AntennaControlPanel';
import ScienceControlPanel from './ScienceControlPanel';
import { CO2Graph, MethaneGraph } from './ScienceGraphPanels';
import PDBRailsPanel from './PDBRails';
import ArmControlPanel from './ArmControlPanel';

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
  | 'antennaControlPanel'
  | 'scienceControlPanel'
  | 'co2Graph'
  | 'methaneGraph'
  | 'pdbRails'
  | 'armControlPanel';

type TileId = `${TileType}:${number}`;

const TILE_DISPLAY_NAMES: Record<TileType, string> = {
  mapView: 'Map View',
  rosMonitor: 'System Telemetry',
  waypointList: 'Waypoint List',
  videoControls: 'Video Stream',
  gasSensor: 'Science',
  orientationDisplay: 'Rover Orientation',
  goalSetter: 'Nav2',
  networkHealthMonitor: 'Connection Health',
  MotorStatusPanel: 'Motor Status',
  antennaControlPanel: 'Antenna Control',
  scienceControlPanel: 'Science Motor Control',
  co2Graph: 'CO2 Graph',
  methaneGraph: 'Methane Graph',
  pdbRails: 'PDB Rails',
  armControlPanel: 'Arm Control',
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
  'scienceControlPanel',
  'co2Graph',
  'methaneGraph',
  'pdbRails',
  'armControlPanel',
];

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
            second: makeTileId('MotorStatusPanel'),
            splitPercentage: 35,
          },
          second: makeTileId('networkHealthMonitor'),
        },
        second: makeTileId('rosMonitor'),
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
      title: TILE_DISPLAY_NAMES[type],
      path,
      additionalControls: controls,
    };

    switch (type) {
      case 'mapView':
        return (
          <MosaicWindow {...windowProps}>
            <div style={{ height: '100%', backgroundColor: '#121212' }}>
              <MapView offline />
            </div>
          </MosaicWindow>
        );

      case 'waypointList':
        return (
          <MosaicWindow {...windowProps}>
            <WaypointList />
          </MosaicWindow>
        );

      case 'videoControls':
        return (
          <MosaicWindow {...windowProps}>
            <VideoControls />
          </MosaicWindow>
        );

      case 'rosMonitor':
        return (
          <MosaicWindow {...windowProps}>
            <SystemTelemetryPanel />
          </MosaicWindow>
        );

      case 'networkHealthMonitor':
        return (
          <MosaicWindow {...windowProps}>
            <NetworkHealthTelemetryPanel />
          </MosaicWindow>
        );

      case 'orientationDisplay':
        return (
          <MosaicWindow {...windowProps}>
            <OrientationDisplayPanel />
          </MosaicWindow>
        );

      case 'gasSensor':
        return (
          <MosaicWindow {...windowProps}>
            <GasSensor />
          </MosaicWindow>
        );

      case 'goalSetter':
        return (
          <MosaicWindow {...windowProps}>
            <GoalSetterPanel />
          </MosaicWindow>
        );

      case 'MotorStatusPanel':
        return (
          <MosaicWindow {...windowProps}>
            <MotorStatusPanel />
          </MosaicWindow>
        );

      case 'antennaControlPanel':
        return (
          <MosaicWindow {...windowProps}>
            <AntennaControlPanel />
          </MosaicWindow>
        );
      case 'scienceControlPanel':
        return (
          <MosaicWindow {...windowProps}>
            <ScienceControlPanel />
          </MosaicWindow>
        );
      case 'co2Graph':
        return(
          <MosaicWindow {...windowProps}>
            <CO2Graph />
          </MosaicWindow>
        )
      case 'methaneGraph':
        return(
          <MosaicWindow {...windowProps}>
            <MethaneGraph />
          </MosaicWindow>
        )
      case 'pdbRails':
        return(
          <MosaicWindow {...windowProps}>
            <PDBRailsPanel />
          </MosaicWindow>
        );
      case 'armControlPanel':
        return(
          <MosaicWindow {...windowProps}>
            <ArmControlPanel />
          </MosaicWindow>
        )

      default:
        return <div>Unknown tile</div>;
    }
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
