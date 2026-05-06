'use client';

import React, { useEffect, useState } from "react";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";

const dotStyle = (up: boolean): React.CSSProperties => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  display: "inline-block",
  backgroundColor: up ? "#22c55e" : "#ef4444",
});

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
      name: "/pdb_pg",
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

  const toggleFn = (idx) => {
    const newToggle = toggle.map((el, i) => {
      if (i === idx) {
        return !el
      }else {
        return el
      }
    })
    setToggle(newToggle)
    
    const toggleTopic = new ROSLIB.Topic({
      ros,
      name: "/pdb_toggle",
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

  const failBorder = (idx) => {
    if (pg[idx] === false && toggle[idx] === false) {
      return "3px solid #ffc42b"
    }else {
      return "none"
    }
  }

  return (
    <div
      style={{
        background: "#1e1e1e",
        color: "#f1f1f1",
        padding: 0,
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginTop: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #333" }}></th>
              {LABELS.map((r, idx) => (
                <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #333" }}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold", borderBottom: "1px solid #222" }}>Power Good</td>
              {pg.map((r, idx) => (
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #222", borderTop: failBorder(idx), borderLeft: failBorder(idx), borderRight: failBorder(idx) }}>
                  <span style={dotStyle(r)} />
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold", borderBottom: "1px solid #222"  }}>Toggle</td>
              {toggle.map((r, idx) => (
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #222", borderBottom: failBorder(idx), borderLeft: failBorder(idx), borderRight: failBorder(idx)}}>
                  <button style={{ padding: "8px", backgroundColor: r ? "#22c55e" : "#ef4444", borderRadius: "12px", borderStyle: "none" }} onClick={() => {toggleFn(idx)}}>{r ? "Enable" : "Disable"}</button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PDBRailsPanel;
