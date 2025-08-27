'use client'

import React, {useState, useEffect} from 'react';
import { useWaypoints, Waypoint } from '@/contexts/WaypointContext';
import JSXStyle from 'styled-jsx/style';
import { DISABLED } from '@blueprintjs/core/lib/esm/common/classes';

const WaypointCreatorWindow: React.FC = () => {
    const { addWaypoint } = useWaypoints();
    const [lat, setLat] = useState<number | null>(null);
    const [long, setLong] = useState<number | null>(null);

    return(
        <div 
        style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '1rem',
            margin: '1rem 0',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem',
            maxWidth: '300px',
        }}>
            <div style={{
                display: "flex"
            }}>
                <input 
                type="number"
                value={long ?? ''}
                onChange={(e) => isNaN(parseFloat(e.target.value)) ? setLong(null) : setLong(parseFloat(e.target.value))}
                placeholder="latitude"
                style={{
                    paddingLeft: '5px',
                    // backgroundColor: 'rgba(255,255,255,0.5)',
                    borderRadius: '5px',
                    borderStyle: 'none',
                    margin: '1%',
                    width: "50%",
                    height: "20px",
                }}></input>
                <input 
                type="number"
                value={lat ?? ''}
                onChange={(e) => isNaN(parseFloat(e.target.value)) ? setLat(null) : setLat(parseFloat(e.target.value))}
                placeholder="longitude"
                style={{
                    paddingLeft: '5px',
                    // backgroundColor: 'rgba(255,255,255,0.5)',
                    borderRadius: '5px',
                    borderStyle: 'none',
                    margin: '1%',
                    width: "50%",
                    height: "20px",
                }}></input>
            </div>
            <button 
                disabled={lat === null || long === null}
                onClick={() => {
                    if (lat !== null && long !== null) {
                        addWaypoint([long, lat]);
                    }
                }}
                style={{
                    backgroundColor: '#0070f3',
                    color: 'white',
                    borderStyle: 'none',
                    borderRadius: '5px',
                    width: '98%',
                    margin: '1%',
                    height: '1.5rem',
                    cursor: lat === null || long === null ? 'not-allowed' : 'pointer',
                }}>
            Create Waypoint </button>
            
        </div>
    );
}
export default WaypointCreatorWindow;