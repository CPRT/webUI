'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LatLngTuple = [number, number];

export interface Waypoint {
  name: string;
  order: number;
  coordinate: LatLngTuple;
  color: string;
}

interface WaypointContextType {
  waypoints: Waypoint[];
  addWaypoint: (coordinate: LatLngTuple) => void;
  removeWaypoint: (index: number) => void;
  clearWaypoints: () => void;
  updateWaypoint: (index: number, updated: Waypoint) => void;
}

const WaypointContext = createContext<WaypointContextType | undefined>(undefined);

export const WaypointProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const addWaypoint = (coordinate: LatLngTuple) => {
    setWaypoints((prev) => [
      ...prev,
      {
        name: `Waypoint ${prev.length + 1}`,
        order: prev.length + 1,
        coordinate,
        color: '#ff0000',
      },
    ]);
  };

  const removeWaypoint = (index: number) =>
    setWaypoints((prev) => prev.filter((_, i) => i !== index));

  const clearWaypoints = () => setWaypoints([]);

  const updateWaypoint = (index: number, updated: Waypoint) =>
    setWaypoints((prev) => prev.map((wp, i) => (i === index ? updated : wp)));

  return (
    <WaypointContext.Provider value={{ waypoints, addWaypoint, removeWaypoint, clearWaypoints, updateWaypoint }}>
      {children}
    </WaypointContext.Provider>
  );
};

export const useWaypoints = (): WaypointContextType => {
  const context = useContext(WaypointContext);
  if (!context) {
    throw new Error('useWaypoints must be used within a WaypointProvider');
  }
  return context;
};

