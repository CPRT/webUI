"use client";

import React from "react";
import { VideoOutRequest } from "./WebRTCClientPage";

interface VideoPresetsPanelProps {
  onPresetSelect: (presetName: string, preset: VideoOutRequest) => void;
}

const VideoPresetsPanel: React.FC<VideoPresetsPanelProps> = ({
  onPresetSelect,
}) => {
  const presets: { name: string; preset: VideoOutRequest }[] = [
    {
      name: "Drive",
      preset: {
        num_sources: 1,
        sources: [{ name: "Drive", width: 100, height: 100, origin_x: 0, origin_y: 0 }],
      },
    },
    {
      name: "EEF",
      preset: {
        num_sources: 1,
        sources: [{ name: "EndEffector", width: 100, height: 100, origin_x: 0, origin_y: 0 }],
      },
    },
    {
      name: "Microscope",
      preset: {
        num_sources: 1,
        sources: [{ name: "Microscope", width: 100, height: 100, origin_x: 0, origin_y: 0 }],
      },
    },
    {
      name: "Belly",
      preset: {
        num_sources: 1,
        sources: [{ name: "Bottom", width: 100, height: 100, origin_x: 0, origin_y: 0 }],
      },
    },
    {
      name: "Drive + EEF",
      preset: {
        num_sources: 2,
        sources: [
          { name: "Drive", width: 100, height: 100, origin_x: 0, origin_y: 0 },
          { name: "EndEffector", width: 30, height: 30, origin_x: 70, origin_y: 0 },
        ],
      },
    },
    {
      name: "EEF + Drive",
      preset: {
        num_sources: 2,
        sources: [
          { name: "EndEffector", width: 100, height: 100, origin_x: 0, origin_y: 0 },
          { name: "Drive", width: 30, height: 30, origin_x: 70, origin_y: 0 },
        ],
      },
    },
  ];

  const buttonStyle = (): React.CSSProperties => ({
    border: "1px solid #444",
    borderRadius: "4px",
    backgroundColor: "#1e1e1e",
    color: "#f1f1f1",
    padding: "0.45rem 0.6rem",
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  });

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      {presets.map(({ name, preset }) => (
        <button
          key={name}
          style={buttonStyle()}
          onClick={() => onPresetSelect(name, preset)}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

export default VideoPresetsPanel;
