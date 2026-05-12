'use client';

import React, { useEffect, useState } from "react";
import ROSLIB from "roslib";
import { useROS } from '@/ros/ROSContext';

const LABELS = [
  "12V #1",
  "12V #2",
  "12V #3",
  "12V #4",
  "5V #1",
  "5V #2",
  "5V #3",
];

const PDBRailsPanel: React.FC = () => {
  const { ros } = useROS();

  const [pg, setPg] = useState([false, false, false, false, false, false, false]);
  const [toggle, setToggle] = useState([false, false, false, false, false, false, false]); // Brittle -- assumes everything is enabled to begin with. This is bad but probably fine
  
  useEffect(() => {
    if (!ros) return;

    const pgTopic = new ROSLIB.Topic({
      ros,
      name: "/pdb_rails/pdb_pg",
      messageType: "std_msgs/msg/UInt8",
    });

    const handlePg = (msg: ROSLIB.Message) => {
      const data = (msg as any).data as number;
      setPg([
        ((data & 0x01) ? true : false),
        ((data & 0x02) ? true : false),
        ((data & 0x04) ? true : false),
        ((data & 0x08) ? true : false),
        ((data & 0x10) ? true : false),
        ((data & 0x20) ? true : false),
        ((data & 0x40) ? true : false)
      ]);
    };

    pgTopic.subscribe(handlePg);

    return () => {
      pgTopic.unsubscribe(handlePg);
    };
  }, [ros]);

  const toggleFn = (idx: number) => {
    const newToggle = toggle.map((el, i) => {
      if (i === idx) {
        return !el
      }else {
        return el
      }
    })
    setToggle(newToggle)

    if (!ros) return;
    
    const toggleTopic = new ROSLIB.Topic({
      ros,
      name: "/pdb_rails/pdb_toggle",
      messageType: "std_msgs/msg/UInt8",
    });

    toggleTopic.publish(new ROSLIB.Message({ data: 
      ((newToggle[0] ? 0x01 : 0x00) |
       (newToggle[1] ? 0x02 : 0x00) |
       (newToggle[2] ? 0x04 : 0x00) |
       (newToggle[3] ? 0x08 : 0x00) |
       (newToggle[4] ? 0x10 : 0x00) |
       (newToggle[5] ? 0x20 : 0x00) |
       (newToggle[6] ? 0x40 : 0x00))
    }));
  };

  const failBorder = (idx: number) => {
    if (pg[idx] === false && toggle[idx] === false) {
      return "warn"
    }else {
      return ""
    }
  }

  return (
    <div className="pdb-panel">
      <div style={{ marginTop: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Rail</th>
              <th>PG</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {LABELS.map((r, idx) => (
              <tr className={failBorder(idx)}>
                <td>
                  {r}
                </td>
                <td>
                  <span style={{ backgroundColor: pg[idx] ? "#22c55e" : "#ef4444" }} />
                </td>
                <td>
                  <button className={toggle[idx] ? "btn-on" : "btn-off"} onClick={() => {toggleFn(idx)}}>{toggle[idx] ? "On" : "Off"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .pdb-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 0;
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          text-align: center;
        }

        table {
          border-spacing: 0;
          width: 100%;
        }

        th {
          border-bottom: 1px solid #333;
        }

        td {
          padding: 8px;
          border-bottom: 1px solid #222;
        }

        .warn td {
          padding: 5px 8px 5px 8px;
          border: 3px solid #ffc42b;
          border-style: solid none solid none;
        }

        .warn td:first-child {
          padding: 5px 8px 5px 5px;
          border: 3px solid #ffc42b;
          border-style: solid none solid solid;
        }
        
        .warn td:last-child {
          padding: 5px 5px 5px 8px;
          border: 3px solid #ffc42b;
          border-style: solid solid solid none;
        }
        
        span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        button {
          min-width: 38px;
          border-radius: 12px;
          border-style: none;
          padding: 8px;
          cursor: pointer;
        }

        .btn-on {
          background-color: #22c55e;
        }

        .btn-on:hover {
          background-color: #1e7e34;
        }

        .btn-off {
          background-color: #dc3545;
        }

        .btn-off:hover {
          background-color: #A03232;
        }
      `}</style>
    </div>
  );
};

export default PDBRailsPanel;
