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

type VideoPresetsMessage = {
  presets: VideoPreset[];
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
    if (!ros || rosStatus !== "connected") {
      setPresets([]);
      return;
    }

    const presetsTopic = new ROSLIB.Topic({
      ros,
      name: "/video_presets",
      messageType: "interfaces/msg/VideoPresets",
      queue_size: 1,
    });

    const handlePresets = (message: ROSLIB.Message) => {
      const presetsMessage = message as unknown as VideoPresetsMessage;
      setPresets(presetsMessage.presets ?? []);
    };

    presetsTopic.subscribe(handlePresets);

    return () => {
      presetsTopic.unsubscribe(handlePresets);
    };
  }, [ros, rosStatus]);

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