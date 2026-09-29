'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

const getCookie = (name: string, fallback: Waypoint[]) => {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return fallback;

  const value = JSON.parse(decodeURIComponent(cookie.split('=')[1]));

  return value;
};

const setCookie = (name: string, value: Waypoint[]) => {
  document.cookie =
    `${name}=${encodeURIComponent(JSON.stringify(value))}; ` +
    `max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
};

const WaypointContext = createContext<WaypointContextType | undefined>(undefined);

export const WaypointProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [cookiesLoaded, setCookiesLoaded] = useState(false);

  useEffect(() => {
    setWaypoints(getCookie("waypoints", []));
    setCookiesLoaded(true);
  }, [])

  useEffect(() => {
    if (!cookiesLoaded) return;

    setCookie("waypoints", waypoints);
  }, [waypoints, cookiesLoaded])

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

