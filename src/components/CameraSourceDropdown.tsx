"use client";

import React, { useEffect, useState } from "react";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";
import { FaSyncAlt } from "react-icons/fa";

interface CameraSourceDropdownProps {
  onChange: (source: string) => void;
}

const CameraSourceDropdown: React.FC<CameraSourceDropdownProps> = ({ onChange }) => {
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const { ros } = useROS();

  const fetchSources = () => {
    if (!ros) {
      console.error("ROS connection is not established.");
      return;
    }
    const service = new ROSLIB.Service({
      ros: ros!,
      name: "/get_cameras",
      serviceType: "interfaces/srv/GetCameras", // adjust service type if it's differently named
    });

    const request = new ROSLIB.ServiceRequest({});

    service.callService(request, (result) => {
      if (result && Array.isArray(result.sources)) {
        setSources(result.sources);
        if (result.sources.length > 0) {
          setSelectedSource(result.sources[0]);
          onChange(result.sources[0]);
        }
      } else {
        console.error("Failed to fetch camera sources.");
      }
    });
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSource(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "0.5rem" }}>
        <select
          value={selectedSource}
          onChange={handleChange}
          style={{
            padding: "0.5rem",
            borderRadius: "0.25rem",
            border: "2px solid #212121",
            background: "#ffffff",
            flex: 1,
          }}
        >
          {sources.map((source, index) => (
            <option key={index} value={source}>
              {source}
            </option>
          ))}
        </select>
        <button
          onClick={fetchSources}
          style={{
            padding: "0.5rem",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "auto",
            height: "auto",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#005bb5")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0070f3")}
        >
          <FaSyncAlt /> {/* Refresh icon */}
        </button>
      </div>
    </div>
  );
};

export default CameraSourceDropdown;
