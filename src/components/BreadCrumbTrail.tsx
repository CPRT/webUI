'use client';

import React, { useState, useEffect } from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import { useROS } from '@/ros/ROSContext';
import { useWaypoints } from '@/contexts/WaypointContext';
import ROSLIB from 'roslib';
import L from 'leaflet'

interface Breadcrumb {
  coordinate: [number, number];
  timestamp: number;
}

const breadcrumbIcon = L.icon({
  iconUrl: '../../public/marker-icon.png',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  popupAnchor: [0, -5],
});

const BreadcrumbTrail: React.FC = () => {
  const { ros, connectionStatus } = useROS();
  const { addWaypoint } = useWaypoints();
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [paused, setPaused] = useState<boolean>(false);
  const [lastFix, setLastFix] = useState<Breadcrumb | null>(null);

  // i hate react
  useEffect(() => {
    if (!ros) return;

    const fixTopic = new ROSLIB.Topic({
      ros,
      name: '/gps/fix',
      messageType: 'sensor_msgs/NavSatFix',
    });

    const handleFix = (message: any) => {
      if (paused) return;
      // Assuming the /fix message contains 'latitude' and 'longitude'
      const { latitude, longitude } = message;
      const newFix: Breadcrumb = {
        coordinate: [latitude, longitude],
        timestamp: Date.now(),
      };
      setBreadcrumbs((prev) => [...prev, newFix]);
      setLastFix(newFix);
    };

    fixTopic.subscribe(handleFix);
    return () => {
      fixTopic.unsubscribe(handleFix);
    };
  }, [ros, paused]);

  const clearBreadcrumbs = () => {
    setBreadcrumbs([]);
    setLastFix(null);
  };

  // cool thing for calculating distance on a sphere
  const haversineDistance = (
    [lat1, lon1]: [number, number],
    [lat2, lon2]: [number, number]
  ): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // radius of my nutz in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const computeDistance = (): number => {
    if (breadcrumbs.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < breadcrumbs.length; i++) {
      total += haversineDistance(
        breadcrumbs[i - 1].coordinate,
        breadcrumbs[i].coordinate
      );
    }
    return total;
  };

  const totalDistance = computeDistance();

  const handleAddWaypoint = () => {
    if (lastFix) {
      addWaypoint(lastFix.coordinate);
    }
  };

  return (
    <>
      {/* render the crumbs bomboclart*/}
      {breadcrumbs.length > 0 && (
        <Polyline
          positions={breadcrumbs.map((b) => b.coordinate)}
          color="yellow"
        />
      )}
      {breadcrumbs.map((breadcrumb, index) => (
        <Marker key={index} position={breadcrumb.coordinate} icon={breadcrumbIcon}>
          <Popup>
            <div style={{ fontSize: '0.85rem' }}>
              Recorded at: {new Date(breadcrumb.timestamp).toLocaleTimeString()}
            </div>
          </Popup>
        </Marker>
      ))}

      <div
        style={{
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '1rem',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '0.9rem',
          maxWidth: '300px',
        }}
      >
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>GPS Fix Status</strong>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>ROS Connection:</strong>{' '}
          <span style={{ color: connectionStatus === 'connected' ? 'green' : 'red' }}>
            {connectionStatus}
          </span>
        </div>
        {lastFix ? (
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Last Fix:</strong>
            <br />
            {/* TODO: Is this enough percision? */}
            Lat: {lastFix.coordinate[0].toFixed(6)}
            <br />
            Lon: {lastFix.coordinate[1].toFixed(6)}
            <br />
            Time: {new Date(lastFix.timestamp).toLocaleTimeString()}
          </div>
        ) : (
          <div style={{ marginBottom: '0.5rem' }}>No fix data received yet.</div>
        )}
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Total Fixes:</strong> {breadcrumbs.length}
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Total Distance:</strong> {totalDistance.toFixed(2)} km
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <button
            onClick={() => setPaused(!paused)}
            style={{
              marginRight: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: '#0070f3',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={clearBreadcrumbs}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#d9534f',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
        {lastFix && (
          <button
            onClick={handleAddWaypoint}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#28a745',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Add Waypoint
          </button>
        )}
      </div>
    </>
  );
};

export default BreadcrumbTrail;

