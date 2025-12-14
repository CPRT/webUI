'use client';

import React, { useState, ReactElement } from 'react';
import {
  Mosaic,
  MosaicWindow,
  MosaicNode,
  MosaicPath,
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

type MosaicKey = 'mapView' | 'rosMonitor' | 'waypointList' | 'videoControls' | 'gasSensor' | 'orientationDisplay' | 'goalSetter' | 'networkHealthMonitor';

const MosaicDashboard: React.FC = () => {
  // TODO: paramaterize layout for custom layout configs
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

  const renderTile = (id: MosaicKey, path: MosaicPath): ReactElement => {
    switch (id) {
      case 'mapView':
        return (
          <MosaicWindow<MosaicKey> title="Map View" path={path}>
            <div style={{ height: '100%', backgroundColor: '#121212' }}>
              <MapView offline/>
            </div>
          </MosaicWindow>
        );
      case 'waypointList':
        return (
          <MosaicWindow<MosaicKey> title="Waypoint List" path={path}>
            <WaypointList />
          </MosaicWindow>
        );
      case 'videoControls':
        return (
          <MosaicWindow<MosaicKey> title="Video Stream" path={path}>
            <VideoControls />
          </MosaicWindow>
        );
      case 'rosMonitor':
        return (
          <MosaicWindow<MosaicKey> title="System Telemetry" path={path}>
            <SystemTelemetryPanel />
          </MosaicWindow>
        );
      case 'networkHealthMonitor':
        return (
          <MosaicWindow<MosaicKey> title="Connection Health" path={path}>
            <NetworkHealthTelemetryPanel />
          </MosaicWindow>
        );
      case 'orientationDisplay':
        return (
          <MosaicWindow<MosaicKey> title="Rover Orientation" path={path}>
            <OrientationDisplayPanel />
          </MosaicWindow>
        );
      case 'gasSensor':
          return (
            <MosaicWindow<MosaicKey> title="Science" path={path}>
              <GasSensor/>
            </MosaicWindow>
          );
      
      case 'goalSetter':
        return (
          <MosaicWindow<MosaicKey> title="Nav2" path={path}>
            <GoalSetterPanel />
          </MosaicWindow>
        );
      default:
        return <div>Unknown tile</div>;
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
      `}</style>
    </div>
  );
};

export default MosaicDashboard;

