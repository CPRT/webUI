'use client';
import React, { useEffect } from "react";
import VideoCustomPresetForm from "../VideoCustomPresetForm";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";
import VideoPresetsPanel from "../VideoPresetsPanel";
import toast from "react-hot-toast";

export interface VideoSource {
  name: string;
  width: number;
  height: number;
  origin_x: number;
  origin_y: number;
}

export interface VideoOutRequest {
  sources: VideoSource[];
}

interface VideoOutResponse {
  success: boolean;
}

interface CapturePanoramaFeedback {
  current_image: number;
  total_images: number;
  status: string;
}

interface CapturePanoramaResult {
  success: boolean;
  image: {
    data: string | number[];
    format: string;
  };
}

const VideoControls: React.FC = () => {
  const { ros, connectionStatus: rosStatus } = useROS();

  const triggerIFrame = () => {
    if (!ros || rosStatus !== "connected") return;
    const topic = new ROSLIB.Topic({
      ros,
      name: "/rtp_node/trigger_iframe",
      messageType: "std_msgs/msg/Empty",
    });
    topic.publish(new ROSLIB.Message({}));
    console.log("Manual I-Frame triggered");
  };

  const setBitrate = (bitrate: number) => {
    if (!ros || rosStatus !== "connected") return;
    const topic = new ROSLIB.Topic({
      ros,
      name: "/rtp_node/set_bitrate",
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
        if (!response.success) {
          toast.error("Failed to select preset: " + presetName)
        }
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

  const openImage = (imageData: string | number[], format: string = "jpeg") => {
    const bytes =
      typeof imageData === "string"
        ? Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0))
        : new Uint8Array(imageData);

    const imageFormat = format.toLowerCase();
    const mimeType =
      imageFormat === "png"
        ? "image/png"
        : "image/jpeg";

    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const win = window.open();
    if (win) {
      win.document.write(`<img src="${url}" style="max-width:100%">`);
    }

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const callVideoCaptureService = (serviceName: string, filename: string = "") => {
    if (!ros || rosStatus !== "connected") return;

    const client = new ROSLIB.Service({
      ros,
      name: serviceName,
      serviceType: "interfaces/srv/VideoCapture",
    });

    const request = new ROSLIB.ServiceRequest({
      filename,
    });

    client.callService(request, (response: any) => {
      if (!response.success) {
        console.error(`Service ${serviceName} failed`);
        toast.error("Failed to capture snapshot");
        return;
      }

      const imageData = response.image?.data;

      if (!imageData) {
        console.error("No image data returned");
        toast.error("No image data returned");
        return;
      }

      openImage(imageData, response.image.format);
    });
  };

    const callPanoramicAction = (filename: string = "") => {
    if (!ros || rosStatus !== "connected") return;

    const actionClient = new ROSLIB.ActionClient({
      ros,
      serverName: "/capture_panoramic",
      actionName: "interfaces/action/CapturePanorama",
    });

    const goal = new ROSLIB.Goal({
      actionClient,
      goalMessage: {
        filename,
      },
    });

    const toastId = toast.loading("Starting panoramic capture");

    goal.on("feedback", (feedback: CapturePanoramaFeedback) => {
      console.log(
        `Panoramic feedback: ${feedback.current_image}/${feedback.total_images} - ${feedback.status}`
      );

      toast.loading(
        `${feedback.status} (${feedback.current_image}/${feedback.total_images})`,
        {
          id: toastId,
        }
      );
    });

    goal.on("result", (result: CapturePanoramaResult) => {
      actionClient.dispose();

      if (!result.success) {
        console.error("Panoramic action failed");
        toast.error("Failed to capture panorama", {
          id: toastId,
        });
        return;
      }

      const imageData = result.image?.data;

      if (!imageData || imageData.length === 0) {
        console.error("No panoramic image data returned");
        toast.error("No panoramic image data returned", {
          id: toastId,
        });
        return;
      }

      toast.success("Panoramic capture completed", {
        id: toastId,
      });

      openImage(imageData, result.image.format);
    });

    goal.on("timeout", () => {
      actionClient.dispose();

      console.error("Panoramic action timed out");
      toast.error("Panoramic capture timed out", {
        id: toastId,
      });
    });

    goal.send();
  };

  const onSnapshot = () => {
    callVideoCaptureService("/capture_frame");
  };

  const onPanoramic = () => {
    callPanoramicAction();
  };

  const setFramerate = (framerate: number) => {
    if (!ros || rosStatus !== "connected") return;
    const setParamsClient = new ROSLIB.Service({
      ros,
      name: "/rtp_node/set_parameters",
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
  // Shift + s for snapshot 
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSnapshotShortcut =
        event.shiftKey && event.key.toLowerCase() === "s";

      if (!isSnapshotShortcut) return;
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        !!target?.isContentEditable;

      if (isEditableTarget || !connected) return;

      event.preventDefault();
      onSnapshot();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [connected]);

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
        </div>

        <div style={{ height: "100%", overflow: "auto", flex: 1, minWidth: 0 }}>
          <VideoCustomPresetForm onSubmit={(preset) => newPreset("Custom", preset)} />
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
