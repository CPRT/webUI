'use client';

import React, { useState } from 'react';
import { useWaypoints, Waypoint } from '@/contexts/WaypointContext';

const WaypointList: React.FC = () => {
  const { waypoints, removeWaypoint, updateWaypoint } = useWaypoints();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedWaypoint, setEditedWaypoint] = useState<Waypoint | null>(null);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditedWaypoint({ ...waypoints[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditedWaypoint(null);
  };

  const saveEditing = (index: number) => {
    if (editedWaypoint) {
      updateWaypoint(index, editedWaypoint);
    }
    setEditingIndex(null);
    setEditedWaypoint(null);
  };

  return (
    <div
      style={{
        padding: '1rem',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#1e1e1e',
        color: '#f1f1f1',
      }}
    >
      <h2 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>Waypoint List</h2>
      {waypoints.length === 0 ? (
        <p>No waypoints added. Click on the map to add one👿</p>
      ) : (
        < ul style={{ listStyle: 'none', padding: 0 }}>
          {/*Ty chat gpt for styling this*/}
          {waypoints.map((wp, index) => (
            <li
              key={index}
              style={{
                marginBottom: '0.5rem',
                padding: '0.5rem',
                border: '1px solid #444',
                borderRadius: '4px',
              }}
            >
              {editingIndex === index && editedWaypoint ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <label style={{ marginRight: '0.5rem' }}>Name:</label>
                    <input
                      type="text"
                      value={editedWaypoint.name}
                      onChange={(e) => setEditedWaypoint({ ...editedWaypoint, name: e.target.value })}
                      style={{ padding: '0.25rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ marginRight: '0.5rem' }}>Number:</label>
                    <input
                      type="number"
                      value={editedWaypoint.order}
                      onChange={(e) => setEditedWaypoint({ ...editedWaypoint, order: Number(e.target.value) })}
                      style={{ padding: '0.25rem', width: '60px' }}
                    />
                  </div>
                  <div>
                    <label style={{ marginRight: '0.5rem' }}>Color:</label>
                    <input
                      type="color"
                      value={editedWaypoint.color}
                      onChange={(e) => setEditedWaypoint({ ...editedWaypoint, color: e.target.value })}
                      style={{ padding: '0.25rem' }}
                    />
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button onClick={() => saveEditing(index)} style={{ marginRight: '0.5rem' }}>
                      Save
                    </button>
                    <button onClick={cancelEditing}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ backgroundColor: wp.color, width: '12px', height: '12px', borderRadius: '50%' }} />
                  <span>{`Waypoint ${wp.order}: ${wp.name} [${wp.coordinate[0].toFixed(6)}, ${wp.coordinate[1].toFixed(6)}]`}</span>
                  <button
                    onClick={() => startEditing(index)}
                    style={{
                      marginLeft: 'auto',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#444',
                      color: '#f1f1f1',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeWaypoint(index)}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#444',
                      color: '#f1f1f1',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )
      }
    </div >
  );
};

export default WaypointList;

