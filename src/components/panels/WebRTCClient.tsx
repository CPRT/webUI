'use client';

import '@/webrtc-api';
import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import SetResetPanel from '../SetResetPanel';

import { useROS } from '@/ros/ROSContext';

// Type Definitions
interface IStreamHTMLElement extends HTMLLIElement {
  _consumerSession?: {
    streams: MediaStream[];
    addEventListener: (event: string, callback: () => void) => void;
    connect: () => void;
    close: () => void;
  };
}

interface WebRTCPanelProps {
  config?: WebRTCRosClientConfig;
}

interface WebRTCRosClientConfig {
  signalingUrl?: string;
  videoServiceName?: string;
  videoServiceMessageType?: string;
  mockMode?: boolean;
}

interface Producer {
  id: string;
}

interface GstWebRTCAPI {
  createConsumerSession: (producerId: string) => IStreamHTMLElement['_consumerSession'];
  registerProducersListener: (listener: {
    producerAdded: (producer: Producer) => void;
    producerRemoved: (producer: Producer) => void;
  }) => void;
  setSignalingServerUrl: (url: string) => void;
  getAvailableProducers: () => Producer[];
}

// Default Configuration
const defaultConfig: WebRTCRosClientConfig = {
  signalingUrl: 'ws://localhost:8443',
  videoServiceName: '/start_video',
  videoServiceMessageType: 'interfaces/srv/VideoOut',
  mockMode: false,
};

const GstWebRTCPanel: React.FC<WebRTCPanelProps> = ({
  config = defaultConfig,
}) => {
  const { ros, connectionStatus: rosStatus } = useROS();

  const apiRef = useRef<GstWebRTCAPI | null>(null);
  const remoteStreamsRef = useRef<HTMLUListElement | null>(null);

  const [signalingUrl, setSignalingUrl] = useState(
    config.signalingUrl || defaultConfig.signalingUrl!,
  );

  const initRemoteStreams = (api: GstWebRTCAPI) => {
    const listener = {
      producerAdded: (producer: Producer) => {
        const remoteStreamsElement = remoteStreamsRef.current;
        if (!remoteStreamsElement) return;

        const existingElement = Array.from(remoteStreamsElement.children).find(
          (element) => element.getAttribute('data-producer-id') === producer.id,
        );

        if (existingElement) return;

        const entryElement = document.createElement('li') as IStreamHTMLElement;
        entryElement.className = 'stream-entry';
        entryElement.setAttribute('data-producer-id', producer.id);

        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';

        const videoElement = document.createElement('video');
        videoElement.className = 'video-stream';
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true;

        videoContainer.appendChild(videoElement);
        entryElement.appendChild(videoContainer);
        remoteStreamsElement.appendChild(entryElement);

        const session = api.createConsumerSession(producer.id);
        entryElement._consumerSession = session;

        session?.addEventListener('streamsChanged', () => {
          const streams = session.streams;

          if (streams.length > 0) {
            videoElement.srcObject = streams[0];

            videoElement.play().catch((error) => {
              console.warn('Autoplay failed:', error);
            });
          }
        });

        session?.connect();
      },

      producerRemoved: (producer: Producer) => {
        const remoteStreamsElement = remoteStreamsRef.current;
        if (!remoteStreamsElement) return;

        const entryElement = Array.from(remoteStreamsElement.children).find(
          (element) => element.getAttribute('data-producer-id') === producer.id,
        ) as IStreamHTMLElement | undefined;

        if (entryElement) {
          entryElement._consumerSession?.close();
          entryElement.remove();
        }
      },
    };

    api.registerProducersListener(listener);
    api.getAvailableProducers().forEach(listener.producerAdded);
  };

  const stop = () => {
    if (apiRef.current) {
      const remoteStreamsElement = remoteStreamsRef.current;
      if (!remoteStreamsElement) return;

      Array.from(remoteStreamsElement.children).forEach((element) => {
        const streamElement = element as IStreamHTMLElement;
        streamElement._consumerSession?.close();
      });

      remoteStreamsElement.replaceChildren();
      apiRef.current = null;
    }
  };

  useEffect(() => {
    if (!signalingUrl) return;

    if (apiRef.current) {
      apiRef.current.setSignalingServerUrl(signalingUrl);
      return;
    }

    const GstWebRTCAPIConstructor = (
      window as typeof window & {
        GstWebRTCAPI?: new (options: {
          signalingServerUrl: string;
        }) => GstWebRTCAPI;
      }
    ).GstWebRTCAPI;

    if (!GstWebRTCAPIConstructor) {
      console.error('GstWebRTCAPI is not available');
      return;
    }

    const api = new GstWebRTCAPIConstructor({
      signalingServerUrl: signalingUrl,
    });

    apiRef.current = api;
    initRemoteStreams(api);

    return () => {
      const remoteStreamsElement = remoteStreamsRef.current;
      if (!remoteStreamsElement) return;

      Array.from(remoteStreamsElement.children).forEach((element) => {
        const streamElement = element as IStreamHTMLElement;
        streamElement._consumerSession?.close();
      });

      remoteStreamsElement.replaceChildren();
      apiRef.current = null;
    };
    // GstWebRTCAPI should only be created once for the panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (apiRef.current && signalingUrl) {
      apiRef.current.setSignalingServerUrl(signalingUrl);
    }
  }, [signalingUrl]);

  return (
    <div className="webrtc-panel">
      <div className="stream-section">
        <ul ref={remoteStreamsRef} className="remote-streams" />
      </div>

      <div className="settings-section">
        <SetResetPanel
          onUrlChange={setSignalingUrl}
          onReset={stop}
          defaultUrl={config.signalingUrl || defaultConfig.signalingUrl!}
          id="signaling_server_url"
          button2Name="Stop"
        />
      </div>

      <style jsx>{`
        .webrtc-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow: hidden;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .stream-section {
          flex: 1 1 auto;
          min-height: 200px;
          overflow: hidden;
          background: #111;
          border: 1px solid #444;
          border-radius: 6px;
        }

        .remote-streams {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          list-style: none;
          overflow: auto;
        }

        .preset-section {
          flex: 0 0 auto;
          width: 100%;
          min-height: 4rem;
        }

        .settings-section {
          flex: 0 0 auto;
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .tools-section {
          flex: 0 0 auto;
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          width: 100%;
        }

        .capture-panel {
          flex: 1 1 300px;
          max-width: 500px;
          min-width: 0;
        }

        .custom-preset-panel {
          flex: 1 1 300px;
          max-width: 600px;
          min-width: 0;
        }

        .webrtc-panel :global(.stream-entry) {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }

        .webrtc-panel :global(.video-container) {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .webrtc-panel :global(.video-stream) {
          display: block;
          width: 100%;
          height: 100%;
          max-height: 100%;
          object-fit: contain;
          background: #000;
        }

        @media (max-width: 700px) {
          .webrtc-panel {
            padding: 0.75rem;
          }

          .tools-section {
            flex-direction: column;
          }

          .capture-panel,
          .custom-preset-panel {
            width: 100%;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default GstWebRTCPanel;