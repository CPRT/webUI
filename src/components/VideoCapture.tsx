"use client";

import React, { useState } from "react";
import ROSLIB from "roslib";
import CameraSourceDropdown from "./CameraSourceDropdown";
import { useROS } from "@/ros/ROSContext";
import { Console } from "console";

interface VideoCaptureResponse {
  image: {
    header: {
      stamp: { sec: number; nanosec: number };
      frame_id: string;
    };
    format: string;
    data: string | number[];
  };
  success: boolean;
}

const VideoCapturePanel: React.FC = () => {
  const { ros, connectionStatus } = useROS();
  const [source, setSource] = useState("");
  const [filename, setFilename] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const captureImage = () => {
    if (!ros || connectionStatus !== "connected") {
      console.error("Not connected to ROS");
      return;
    }
    console.log("Capturing image from source:", source);

    const captureService = new ROSLIB.Service({
      ros,
      name: "/capture_frame",
      serviceType: "interfaces/srv/VideoCapture",
    });
    const panService = new ROSLIB.Service({
      ros,
      name: "/capture_panoramic",
      serviceType: "interfaces/srv/VideoCapture",
    });

    const capture_cb = (response: VideoCaptureResponse) => {
      console.log("Capture response:", response);
      if (response.success) {
        let imageBase64 = "";

        if (typeof response.image.data === "string") {
          imageBase64 = `data:image/${response.image.format};base64,${response.image.data}`;
        } else if (response.image.data instanceof Array) {
          const uint8Array = new Uint8Array(response.image.data);
          const binary = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), "");
          imageBase64 = `data:image/${response.image.format};base64,${btoa(binary)}`;
        } else {
          console.error("Unexpected image data type");
          return;
        }

        setImageData(imageBase64);
        setFormat(response.image.format);
        const stamp = response.image.header.stamp;
        setTimestamp(`${stamp.sec}.${stamp.nanosec}s`);
      } else {
        console.error("Failed to capture image.");
      }
    }
    const request = new ROSLIB.ServiceRequest({ source, filename });
    if (source === "Panoramic") {
      panService.callService(request, capture_cb);
    } else {
      captureService.callService(request, capture_cb);
    }
  };

  const saveImage = () => {
    if (!imageData) return;
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `capture.${format || "jpg"}`;
    link.click();
  };

  return (
    <div
      style={{
        padding: "1rem",
        background: "#f9f9f9",
        borderRadius: "0.5rem",
        marginLeft: "1rem",
        flex: 1,
        maxWidth: "600px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Capture Image</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label>
          Source
          <CameraSourceDropdown
            onChange={setSource}
          />
        </label>

        <label>
          Filename (optional)
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Saved filename"
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem" }}
          />
        </label>

        <button
          type="button"
          onClick={captureImage}
          style={{
            padding: "0.75rem",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#005bb5")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0070f3")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Capture Image
        </button>
      </div>

      {imageData && (
        <div
          style={{
            padding: "0.75rem",
            border: "1px solid #ddd",
            borderRadius: "0.5rem",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div>
            <strong>Format:</strong> {format} &nbsp; | &nbsp;
            <strong>Timestamp:</strong> {timestamp}
          </div>

          <img
            src={imageData}
            alt="Captured"
            style={{ maxWidth: "100%", borderRadius: "0.25rem" }}
          />

          <button
            type="button"
            onClick={saveImage}
            style={{
              padding: "0.75rem",
              background: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1e7e34")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#28a745")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Save Image
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCapturePanel;
