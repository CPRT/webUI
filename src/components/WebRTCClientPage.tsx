"use client";

import "@/webrtc-api";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import ROSLIB from "roslib";
import WebRTCCustomPresetForm from "./WebRTCCustomPresetForm";
import WebRTCSignalingConfig from "./WebRTCSignalingConfig";
import WebRTCPresetsPanel from "./WebRTCPresetsPanel";
import VideoCapture from "./VideoCapture";

import { useROS } from "@/ros/ROSContext";

// Type Definitions
interface IStreamHTMLElement extends HTMLElement {
  _consumerSession?: any;
}

interface WebRTCClientPageProps {
  config?: WebRTCRosClientConfig;
}

interface WebRTCRosClientConfig {
  signalingUrl?: string;
  videoServiceName?: string;
  videoServiceMessageType?: string;
  mockMode?: boolean;
}

export interface VideoSource {
  name: string;
  width: number;
  height: number;
  origin_x: number;
  origin_y: number;
}

export interface VideoOutRequest {
  num_sources: number;
  sources: VideoSource[];
}

interface VideoOutResponse {
  success: boolean;
}

interface GstWebRTCAPI {
  createConsumerSession: (producerId: string) => any;
  registerProducersListener: (listener: any) => void;
  setSignalingServerUrl: (url: string) => void;
  getAvailableProducers: () => any[];
}

// Default Configuration
const defaultConfig: WebRTCRosClientConfig = {
  signalingUrl: "ws://localhost:8443",
  videoServiceName: "/start_video",
  videoServiceMessageType: "interfaces/srv/VideoOut",
  mockMode: false,
};

// UI Styles
const buttonStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  width: "100%",
  height: "100%",
};

// Main Component
const GstWebRTCPage: React.FC<WebRTCClientPageProps> = ({
  config = defaultConfig,
}) => {
  const apiRef = useRef<GstWebRTCAPI | null>(null);
  const { ros, connectionStatus: rosStatus } = useROS();
  const [signalingUrl, setSignalingUrl] = useState(config.signalingUrl || defaultConfig.signalingUrl);


  const initRemoteStreams = (api: GstWebRTCAPI) => {
    const remoteStreamsElement = document.getElementById("remote-streams");

    const listener = {
      producerAdded: (producer: any) => {
        const producerId = producer.id;
        if (document.getElementById(producerId) || !remoteStreamsElement)
          return;

        remoteStreamsElement.insertAdjacentHTML(
          "beforeend",
          `<li id="${producerId}">
            <div class="video" style="display: flex; flex-direction: row;">
              <video style="width: 100%; height: 85vh;" autoplay playsinline muted></video>
            </div>
          </li>`,
        );

        const entryElement = document.getElementById(
          producerId,
        ) as IStreamHTMLElement;
        const videoElement = entryElement.querySelector(
          "video",
        ) as HTMLVideoElement;

        const session = api.createConsumerSession(producerId);
        entryElement._consumerSession = session;

        session.addEventListener("streamsChanged", () => {
          const streams = session.streams;
          if (streams.length > 0) {
            videoElement.srcObject = streams[0];
            videoElement.play().catch((err) => console.warn("Autoplay failed:", err));
          }
        });

        session.connect();
      },

      producerRemoved: (producer: any) => {
        const element = document.getElementById(
          producer.id,
        ) as IStreamHTMLElement;
        if (element) {
          element._consumerSession?.close();
          element.remove();
        }
      },
    };

    api.registerProducersListener(listener);
    api.getAvailableProducers().forEach(listener.producerAdded);
  };

  const newPreset = (presetName: string, camRequest: VideoOutRequest) => {
    console.log(`Setting new video preset: ${presetName}`, camRequest);
    if (config.mockMode) {
      console.log("Mock mode enabled. ROS service requests disabled.");
      return;
    }

    if (!ros || rosStatus !== "connected") {
      console.error("Not connected to ROS");
      return;
    }

    const startVideoSrv = new ROSLIB.Service({
      ros,
      name: config.videoServiceName || defaultConfig.videoServiceName!,
      serviceType: config.videoServiceMessageType || defaultConfig.videoServiceMessageType!,
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
  const reset = () => {
    if (config.mockMode) {
      console.log("Mock mode enabled. ROS service requests disabled.");
      return;
    }
    if (!ros || rosStatus !== "connected") {
      console.error("Not connected to ROS");
      return;
    }

    const triggerService = new ROSLIB.Service({
      ros,
      name:  "/reset_video",
      serviceType: "std_srvs/srv/Trigger",
    });

    triggerService.callService({}, (response: { success: boolean; message: string }) => {
      if (response.success) {
        console.log("Trigger service succeeded:", response.message);
        window.location.reload();
      } else {
        console.error("Trigger service failed:", response.message);
      }
    });
  };

  useEffect(() => {
    if (apiRef.current && signalingUrl) {
      apiRef.current.setSignalingServerUrl(signalingUrl);
    } else {
      const GstWebRTCAPI = (window as any).GstWebRTCAPI;
      const api: GstWebRTCAPI = new GstWebRTCAPI({
        signalingServerUrl: signalingUrl,
      });
      apiRef.current = api;
      initRemoteStreams(api);
    }
  }, [signalingUrl]);

  // Render
  return (
    <div>
      <ul id="remote-streams"></ul>
      <div style={{ width: "100%", height: "10vh", display: "flex" }}>
        <WebRTCPresetsPanel onPresetSelect={newPreset} />
      </div>
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
        <WebRTCSignalingConfig onUrlChange={setSignalingUrl} onReset={() => reset()}/>
      </div>
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 300px", maxWidth: "500px" }}>
          <VideoCapture />
        </div>
        <div style={{ flex: "1 1 300px", maxWidth: "600px" }}>
          <WebRTCCustomPresetForm onSubmit={(preset) => newPreset("Custom", preset)} />
        </div>
      </div>
    </div>
  );
};

export default GstWebRTCPage;
