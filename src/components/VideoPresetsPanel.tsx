"use client";

import React, { useEffect, useState } from "react";
import { VideoOutRequest, VideoSource } from "./panels/VideoControls";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";

interface VideoPresetsPanelProps {
  onPresetSelect: (presetName: string, preset: VideoOutRequest) => void;
}

type VideoPreset = {
  name: string;
  sources: VideoSource[];
}

const VideoPresetsPanel: React.FC<VideoPresetsPanelProps> = ({
  onPresetSelect,
}) => {
  const { ros, connectionStatus: rosStatus } = useROS();
  const [presets, setPresets] = useState<VideoPreset[]>([]);

  const buttonStyle = (): React.CSSProperties => ({
    border: "1px solid #444",
    borderRadius: "4px",
    backgroundColor: "#1e1e1e",
    color: "#f1f1f1",
    padding: "0.45rem 0.6rem",
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  });

  useEffect(() => {
    if (!ros) {
      console.error("ROS connection is not established.");
      return;
    }
    const getPresetsClient = new ROSLIB.Service({
      ros: ros,
      name: "/list_presets",
      serviceType: "interfaces/srv/GetPresets",
    });

    const request = new ROSLIB.ServiceRequest({});
    getPresetsClient.callService(request, (response) => {
      if (response) {
        setPresets(response.presets);
      }
    });
  }, [ros]);
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      {presets.map(({ name, sources }) => (
        <button
          key={name}
          style={buttonStyle()}
          onClick={() => onPresetSelect(name, { sources: sources })}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

export default VideoPresetsPanel;
