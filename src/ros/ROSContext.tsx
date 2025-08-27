'use client';
// react moment, this shit sucks
import React, { createContext, useContext, useState, useCallback } from 'react';
import ROSLIB from 'roslib';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface ROSContextType {
  ros: ROSLIB.Ros | null;
  connectionStatus: ConnectionStatus;
  connect: (url: string) => void;
  disconnect: () => void;
}

const ROSContext = createContext<ROSContextType | undefined>(undefined);

export const ROSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ros, setRos] = useState<ROSLIB.Ros | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');


  const connect = useCallback((url: string) => {
    // prevents multiple connections from one client, actually pretty important
    if (ros) {
      console.warn('Already connected. Please disconnect first.');
      return;
    }
    setConnectionStatus('connecting')

    const rosInstance = new ROSLIB.Ros({ url });

    rosInstance.on('connection', () => {
      console.log('Connected to ROS');
      setConnectionStatus('connected');
    });

    rosInstance.on('error', (error) => {
      console.error('ROS connection error: ', error);
      setConnectionStatus('error');
    });

    rosInstance.on('close', () => {
      setRos(null);
      console.log('ROS connection closed');
      setConnectionStatus('disconnected');
    });

    setRos(rosInstance);
  }, [ros]);


  const disconnect = useCallback(() => {
    if (ros) {
      ros.close();
      setRos(null);
      setConnectionStatus('disconnected');
    }
  }, [ros]);

  return (
    <ROSContext.Provider value={{ ros, connectionStatus, connect, disconnect }}>
      {children}
    </ROSContext.Provider>
  );
};

export const useROS = (): ROSContextType => {
  const context = useContext(ROSContext);
  if (!context) {
    throw new Error('what are you doing dog, you need to use useROS() within a Provider, dumbass lmfao');
  }
  return context;
};

