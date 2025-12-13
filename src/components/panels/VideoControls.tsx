'use client';

import React from "react";
import VideoCustomPresetForm from "../VideoCustomPresetForm";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";
import VideoPresetsPanel from "../VideoPresetsPanel";
import SrtStats from "../SrtStats";


export interface VideoSource {
  name: string;
  width: number;
  height: number;
  origin_x: number;
  origin_y: number;
}

interface VideoOutResponse {
  success: boolean;
}

export interface VideoOutRequest {
  num_sources: number;
  sources: VideoSource[];
}

const VideoControls: React.FC = () => {
  const { ros, connectionStatus: rosStatus } = useROS();

  const newPreset = (presetName: string, camRequest: VideoOutRequest) => {
    console.log(`Setting new video preset: ${presetName}`, camRequest);

    if (!ros || rosStatus !== "connected") {
      console.error("Not connected to ROS");
      return;
    }

    const startVideoSrv = new ROSLIB.Service({
      ros,
      name: "/start_video",
      serviceType: "interfaces/srv/VideoOut",
    });

    startVideoSrv.callService(
      new ROSLIB.ServiceRequest(camRequest),
      (response: VideoOutResponse) => {
        console[response.success ? "log" : "error"](
          response.success
            ? `Video stream set to new preset ${presetName}`
            : `Failed to change video preset to ${presetName}`,
        );
      },
    );
  };

  // callbacks intentionally blank for now
  const onRestart = () => {};
  const onSnapshot = () => {};
  const onPanoramic = () => {};

  const connected = !!ros && rosStatus === "connected";

  const buttonStyle = (enabled: boolean) => ({
    border: "1px solid #444",
    borderRadius: "4px",
    backgroundColor: enabled ? "#1e1e1e" : "#222",
    color: enabled ? "#f1f1f1" : "#777",
    padding: "0.45rem 0.6rem",
    fontSize: "0.85rem",
  });

  return (
    <div
      style={{
        backgroundColor: "#1e1e1e",
        color: "#f1f1f1",
        height: "100%",
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", height: "calc(100% - 3rem)" }}>
        {/* Left half: controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              border: "1px solid #444",
              borderRadius: "6px",
              backgroundColor: "#2d2d2d",
              padding: "0.75rem",
            }}
          >
            <div style={{ color: "#aaa", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
              Quick Controls
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                onClick={onRestart}
                disabled={!connected}
                style={buttonStyle(connected)}
              >
                Restart
              </button>

              <button
                onClick={onSnapshot}
                disabled={!connected}
                style={buttonStyle(connected)}
              >
                Snapshot
              </button>
              <button
                onClick={onPanoramic}
                disabled={!connected}
                style={buttonStyle(connected)}
              >
                Panoramic
              </button>
            </div>

            <div
              style={{
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid #444",
                color: "#aaa",
                fontSize: "0.8rem",
                lineHeight: 1.4,
              }}
            >
            <VideoPresetsPanel
            onPresetSelect={(name, preset) => newPreset(name, preset)}
            />
            </div>
          </div>
          <SrtStats />
        </div>

        {/* Right half: form */}
        <div
        style={{
            height: "100%",
            overflow: "auto",
            flex: 1, 
            minWidth: 0
        }}
        >
        <VideoCustomPresetForm onSubmit={(preset) => newPreset("Custom", preset)} />
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
