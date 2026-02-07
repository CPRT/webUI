'use client';
import React from "react";
import VideoCustomPresetForm from "../VideoCustomPresetForm";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";
import VideoPresetsPanel from "../VideoPresetsPanel";
import SrtStats from "../SrtStats";
import type { VideoSource, VideoOutRequest } from "../WebRTCClientPage";

interface VideoOutResponse {
  success: boolean;
}
const VideoControls: React.FC = () => {
  const { ros, connectionStatus: rosStatus } = useROS();

  const triggerIFrame = () => {
    if (!ros || rosStatus !== "connected") return;
    const topic = new ROSLIB.Topic({
      ros,
      name: "/srt_node/trigger_iframe",
      messageType: "std_msgs/msg/Empty",
    });
    topic.publish(new ROSLIB.Message({}));
    console.log("Manual I-Frame triggered");
  };

  const setBitrate = (bitrate: number) => {
    if (!ros || rosStatus !== "connected") return;
    const topic = new ROSLIB.Topic({
      ros,
      name: "/srt_node/set_bitrate",
      messageType: "std_msgs/msg/Int32",
    });
    topic.publish(new ROSLIB.Message({ data: bitrate }));
    console.log(`Setting bitrate to: ${bitrate} bps`);
  };

  const newPreset = (presetName: string, camRequest: VideoOutRequest) => {
    if (!ros || rosStatus !== "connected") return;

    const startVideoSrv = new ROSLIB.Service({
      ros,
      name: "/start_video",
      serviceType: "interfaces/srv/VideoOut",
    });

    startVideoSrv.callService(
      new ROSLIB.ServiceRequest(camRequest),
      (response: VideoOutResponse) => {
        console.log(response.success ? "Success" : "Failed");
      },
    );
  };

  const onRestart = () => {
    if (!ros || rosStatus !== "connected") return;
    const topic = new ROSLIB.Topic({
      ros,
      name: "/all_video/restart_pipeline",
      messageType: "std_msgs/msg/Empty",
    });
    topic.publish(new ROSLIB.Message({}));
    console.log("Stream restart triggered");
  };
  const onSnapshot = () => {};
  const onPanoramic = () => {};

  const setLatency = (latency: number) => {
    if (!ros || rosStatus !== "connected") return;

    const setParamsClient = new ROSLIB.Service({
      ros,
      name: "/srt_node/set_parameters",
      serviceType: "rcl_interfaces/srv/SetParameters",
    });

    const request = new ROSLIB.ServiceRequest({
      parameters: [
        {
          name: "latency",
          value: {
            type: 2,
            integer_value: latency,
          },
        },
      ],
    });

    setParamsClient.callService(request, (result) => {
      console.log("Set parameters response:", result);
    });
  };

  const setFramerate = (framerate: number) => {
    if (!ros || rosStatus !== "connected") return;
    const setParamsClient = new ROSLIB.Service({
      ros,
      name: "/srt_node/set_parameters",
      serviceType: "rcl_interfaces/srv/SetParameters",
    });
    const request = new ROSLIB.ServiceRequest({
      parameters: [
        {
          name: "target_framerate",
          value: {
            type: 2,
            integer_value: framerate,
          },
        },
      ],
    });
    setParamsClient.callService(request, (result) => {
      if (result.results && result.results[0].successful) {
        console.log(`Framerate successfully set to ${framerate} fps`);
      } else {
        console.error("Failed to set framerate", result);
      }
    });
    console.log(`Setting framerate to: ${framerate} fps`);
  };

  const connected = !!ros && rosStatus === "connected";

  const buttonStyle = (enabled: boolean) => ({
    border: "1px solid #444",
    borderRadius: "4px",
    backgroundColor: enabled ? "#1e1e1e" : "#222",
    color: enabled ? "#f1f1f1" : "#777",
    padding: "0.45rem 0.6rem",
    fontSize: "0.85rem",
    cursor: enabled ? "pointer" : "not-allowed",
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
      <div style={{ display: "flex", gap: "1rem", height: "100%" }}>
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
              <button onClick={onRestart} disabled={!connected} style={buttonStyle(connected)}>Restart</button>
              <button onClick={onSnapshot} disabled={!connected} style={buttonStyle(connected)}>Snapshot</button>
              <button onClick={onPanoramic} disabled={!connected} style={buttonStyle(connected)}>Panoramic</button>
            </div>

            <div style={{ 
              marginTop: "0.75rem", 
              paddingTop: "0.75rem", 
              borderTop: "1px solid #444",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem"
            }}>
              <div style={{ color: "#aaa", fontSize: "0.8rem" }}>SRT Stream Control</div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                <button
                  onClick={triggerIFrame}
                  disabled={!connected}
                  style={buttonStyle(connected)}
                  title="Force Key Unit"
                >
                  Force I-Frame
                </button>

                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.4rem", 
                  padding: "0.2rem 0.5rem",
                  backgroundColor: "#222",
                  borderRadius: "4px",
                  border: "1px solid #555"
                }}>
                  <span style={{ fontSize: "0.7rem", color: "#888", fontWeight: "bold" }}>Bitrate:</span>
                  <button onClick={() => setBitrate(500000)} disabled={!connected} style={buttonStyle(connected)}>500K</button>
                  <button onClick={() => setBitrate(1000000)} disabled={!connected} style={buttonStyle(connected)}>1M</button>
                  <button onClick={() => setBitrate(2000000)} disabled={!connected} style={buttonStyle(connected)}>2M</button>
                  <button onClick={() => setBitrate(5000000)} disabled={!connected} style={buttonStyle(connected)}>5M</button>
                </div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.4rem", 
                  padding: "0.2rem 0.5rem",
                  backgroundColor: "#222",
                  borderRadius: "4px",
                  border: "1px solid #555"
                }}>
                  <span style={{ fontSize: "0.7rem", color: "#888", fontWeight: "bold" }}>Latency:</span>
                  <button onClick={() => setLatency(50)} disabled={!connected} style={buttonStyle(connected)}>LOW</button>
                  <button onClick={() => setLatency(100)} disabled={!connected} style={buttonStyle(connected)}>MED</button>
                  <button onClick={() => setLatency(200)} disabled={!connected} style={buttonStyle(connected)}>RELIABLE</button>
                </div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.4rem", 
                  padding: "0.2rem 0.5rem",
                  backgroundColor: "#222",
                  borderRadius: "4px",
                  border: "1px solid #555"
                }}>
                  <span style={{ fontSize: "0.7rem", color: "#888", fontWeight: "bold" }}>Framerate:</span>
                  <button onClick={() => setFramerate(1)} disabled={!connected} style={buttonStyle(connected)}>1</button>
                  <button onClick={() => setFramerate(5)} disabled={!connected} style={buttonStyle(connected)}>5</button>
                  <button onClick={() => setFramerate(15)} disabled={!connected} style={buttonStyle(connected)}>15</button>
                  <button onClick={() => setFramerate(30)} disabled={!connected} style={buttonStyle(connected)}>30</button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #444" }}>
              <VideoPresetsPanel onPresetSelect={(name, preset) => newPreset(name, preset)} />
            </div>
          </div>
          <SrtStats />
        </div>

        <div style={{ height: "100%", overflow: "auto", flex: 1, minWidth: 0 }}>
          <VideoCustomPresetForm onSubmit={(preset) => newPreset("Custom", preset)} />
        </div>
      </div>
    </div>
  );
};

export default VideoControls;