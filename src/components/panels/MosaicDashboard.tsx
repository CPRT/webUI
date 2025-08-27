'use client';

import React, { useState, ReactElement } from 'react';
import {
  Mosaic,
  MosaicWindow,
  MosaicNode,
  MosaicPath,
} from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';
import NodeManagerPanel from './NodeManagerPanel';
import WebRTCClientPanel from './WebRTCClientPanel';
import MapView from './MapView';
import WaypointList from './WaypointList';
import SystemTelemetryPanel from './SystemTelemetryPanel';
import OrientationDisplayPanel from './OrientationDisplayPanel';
import GoalSetterPanel from './GoalSetterPanel';
import GasSensor from './GasSensor';
import NetworkHealthTelemetryPanel from './NetworkHealthTelemetryPanel';

type MosaicKey = 'mapView' | 'rosMonitor' | 'waypointList' | 'nodeManager' | 'webrtcStream' | 'gasSensor' | 'orientationDisplay' | 'goalSetter' | 'networkHealthMonitor';

const MosaicDashboard: React.FC = () => {
  // TODO: paramaterize layout for custom layout configs
  const [mosaicLayout, setMosaicLayout] = useState<MosaicNode<MosaicKey> | null>({
    direction: 'row',
    first: {
      direction: 'column',
      first: 'mapView',
      second: {
        direction: 'row',
        first: 'goalSetter',
        second: 'orientationDisplay',
        splitPercentage: 50,
      },
      splitPercentage: 50,
    },
    second: {
      direction: 'column',
      first: {
        direction: 'row',
        first: 'rosMonitor',
        second: 'networkHealthMonitor',
        splitPercentage: 60
      },
      second: {
        direction: 'row',
        first: 'waypointList',
        second: 'gasSensor',
        splitPercentage: 70,
      },
      splitPercentage: 40,
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
      case 'nodeManager':
        return (
          <MosaicWindow<MosaicKey> title="Node Manager" path={path}>
            <NodeManagerPanel />
          </MosaicWindow>
        );
      case 'webrtcStream':
        return (
          <MosaicWindow<MosaicKey> title="Video Stream" path={path}>
            <WebRTCClientPanel config={{ mockMode: true, signalingUrl: 'ws://localhost:8443' }} />
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
          <MosaicWindow<MosaicKey> title="Goal Setter" path={path}>
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
          color: #f1f1f1;
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

