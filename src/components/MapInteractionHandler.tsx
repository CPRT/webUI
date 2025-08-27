'use client';
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import { useWaypoints } from '@/contexts/WaypointContext';

const MapInteractionHandler: React.FC = () => {
  const { addWaypoint } = useWaypoints();

  useMapEvents({
    click(e) {
      const target = e.originalEvent.target as HTMLElement;
      if (target && target.classList.contains('leaflet-container')) {
        const { lat, lng } = e.latlng;
        addWaypoint([lat, lng]);
      }
    },
  });

  return null;
};

export default MapInteractionHandler;

