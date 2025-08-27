'use client';

import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

export interface VideoSource {
  name: string;
  width: number;
  height: number;
  origin_x: number;
  origin_y: number;
}

export interface VideoOutRequest {
  height: number;
  width: number;
  framerate: number;
  num_sources: number;
  sources: VideoSource[];
}

export interface VideoOutResponse {
  success: boolean;
}

export interface WebRTCClientConfig {
  signalingUrl?: string;
  stunServers?: string[]; // tbh we dont need any stun servers, we arent traversing NAT
  videoServiceName?: string;
  videoServiceMessageType?: string;
  defaultVideoRequest?: VideoOutRequest;
  mockMode?: boolean;
}

export interface WebRTCClientPanelProps {
  config?: WebRTCClientConfig;
  createPeerConnection?: (config: WebRTCClientConfig) => RTCPeerConnection;
  createWebSocket?: (url: string) => WebSocket;
}

const defaultConfig: WebRTCClientConfig = {
  signalingUrl: 'ws://localhost:8080/signalling',
  stunServers: ['stun:stun.l.google.com:19302'], // like same comment here, very stunning but not needed
  videoServiceName: 'start_video',
  videoServiceMessageType: 'interfaces/srv/VideoOut',
  defaultVideoRequest: {
    height: 480,
    width: 640,
    framerate: 30,
    num_sources: 1,
    sources: [
      {
        name: 'test',
        width: 100,
        height: 100,
        origin_x: 0,
        origin_y: 0,
      },
    ],
  },
  mockMode: false,
};

const WebRTCClientPanel: React.FC<WebRTCClientPanelProps> = ({
  config = defaultConfig,
  createPeerConnection,
  createWebSocket,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [webrtcStatus, setWebrtcStatus] = useState<string>('disconnected');
  const [streamStarted, setStreamStarted] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);

  const { ros, connectionStatus: rosStatus } = useROS();

  // wtf even is this syntax, i hate react
  const createPC =
    createPeerConnection ??
    ((cfg: WebRTCClientConfig) =>
      new RTCPeerConnection({
        iceServers: (cfg.stunServers ?? defaultConfig.stunServers!).map((url) => ({
          urls: url,
        })),
      }));
  const createWS = createWebSocket ?? ((url: string) => new WebSocket(url));

  // async that shit, for setting up webrtc
  const setupWebRTC = async () => {
    const peerConnection = createPC(config);
    setPc(peerConnection);

    peerConnection.onconnectionstatechange = () => {
      setWebrtcStatus(peerConnection.connectionState);
    };

    // this one only sets up video receive cause that is all we are doing
    peerConnection.addTransceiver('video', { direction: 'recvonly' });
    peerConnection.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        console.log('Remote track event:', event.streams);
      }
    };

    // ICE on my wrist 
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
          })
        );
      }
    };

    // important signalling
    const ws = createWS(config.signalingUrl || defaultConfig.signalingUrl!);
    setSocket(ws);

    ws.onopen = async () => {
      // react shit here and there again
      setWebrtcStatus('connecting');

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      ws.send(
        JSON.stringify({
          type: 'newPeer',
          peerId: crypto.randomUUID(),
          roles: ['consumer'],
          meta: null,
          sdp: offer.sdp,
        })
      );
    };

    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'answer' || data.type === 'peer') {
        const answer = new RTCSessionDescription({ type: 'answer', sdp: data.sdp });
        await peerConnection.setRemoteDescription(answer);
      } else if (data.type === 'candidate') {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    ws.onclose = () => {
      setWebrtcStatus('disconnected');
    };
  };

  // more react bullshit to get the stats of the webrtc stream
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pc) {
      interval = setInterval(async () => {
        const statsReport = await pc.getStats();
        const statsArray: any[] = [];
        statsReport.forEach((report) => {
          statsArray.push(report);
        });
        setStats(statsArray);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pc]);

  const startVideoService = () => {
    if (config.mockMode) {
      console.log('Mock mode enabled, bypassing ROS2 services and what not');
      setStreamStarted(true);
      setupWebRTC();
      return;
    }

    if (!ros || rosStatus !== 'connected') {
      console.error('Not connected to ROS');
      return;
    }

    const startVideoSrv = new ROSLIB.Service({
      ros,
      name: config.videoServiceName || defaultConfig.videoServiceName!,
      serviceType: config.videoServiceMessageType || defaultConfig.videoServiceMessageType!,
    });

    const request: VideoOutRequest = config.defaultVideoRequest || defaultConfig.defaultVideoRequest!;
    startVideoSrv.callService(new ROSLIB.ServiceRequest(request), (response: VideoOutResponse) => {
      if (response.success) {
        console.log('Video stream started successfully on rover.');
        setStreamStarted(true);
        setupWebRTC();
      } else {
        console.error('Failed to start video stream on rover.');
      }
    });
  };

  const stopVideoStream = () => {
    if (pc) {
      pc.close();
      setPc(null);
    }
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setStreamStarted(false);
    setWebrtcStatus('disconnected');
  };

  // cleaning up on unmount ;) 🍆🍆
  useEffect(() => {
    return () => {
      if (pc) pc.close();
      if (socket) socket.close();
    };
  }, [pc, socket]);

  return (
    <div
      style={{
        backgroundColor: '#1e1e1e',
        color: '#f1f1f1',
        padding: '1rem',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h2 style={{ marginBottom: '0.5rem' }}>WebRTC Video Stream</h2>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>Status: {webrtcStatus}</span>
        {streamStarted && (
          <button
            onClick={stopVideoStream}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#d9534f',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Stop Stream
          </button>
        )}
      </div>
      {!streamStarted && (
        <button
          onClick={startVideoService}
          style={{
            padding: '0.5rem',
            marginBottom: '1rem',
            backgroundColor: '#0070f3',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Start Video Stream
        </button>
      )}
      <div style={{ flex: 1, position: 'relative' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          controls
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />
        {stats && (
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '0.5rem',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '0.75rem',
            }}
          >
            <strong>WebRTC Stats</strong>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRTCClientPanel;

