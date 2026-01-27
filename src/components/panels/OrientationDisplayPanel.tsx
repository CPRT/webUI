'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

const OrientationDisplayPanel: React.FC = () => {
  const { ros } = useROS();
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x444444));

    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.4, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x156289 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    scene.add(body);
    cubeRef.current = body;

    const createWheel = () => {
      const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
      const mat = new THREE.MeshStandardMaterial({ color: 0xE91C24 });
      const wheel = new THREE.Mesh(geo, mat);
      wheel.rotation.z = Math.PI / 2;
      return wheel;
    };

    const wheelOffsets = [
      [0.6, -0.3, 0.9],
      [-0.6, -0.3, 0.9],
      [0.6, -0.3, -0.9],
      [-0.6, -0.3, -0.9],
    ];

    wheelOffsets.forEach(([x, y, z]) => {
      const wheel = createWheel();
      wheel.position.set(x, y, z);
      body.add(wheel);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
      }
    });
    resizeObserver.observe(containerRef.current);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!ros || !cubeRef.current) return;

    const imuTopic = new ROSLIB.Topic({
      ros,
      name: '/zed/zed_node/imu/data',
      messageType: 'sensor_msgs/Imu',
      throttle_rate: 100,
    });
    const ZedOffset = 0.33;
    const handleIMU = (msg: any) => {
      const { x, y, z, w } = msg.orientation;
      const newQuat = new THREE.Quaternion(-y, z, -x, w).normalize();
      const euler = new THREE.Euler().setFromQuaternion(newQuat, 'YXZ');
      euler.y = 0;
      // Apply offset to pitch for Zed orientation
      euler.x += ZedOffset;
      const rollPitchQuat = new THREE.Quaternion().setFromEuler(euler);
      cubeRef.current!.quaternion.copy(rollPitchQuat);
    };

    imuTopic.subscribe(handleIMU);
    return () => imuTopic.unsubscribe(handleIMU);
  }, [ros]);

  
  return (
    <div className="orientation-panel">
      <div className="viewport" ref={containerRef}>
      </div>

      <style jsx>{`
        .orientation-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          text-align: center;
          border-bottom: 1px solid #444;
          padding-bottom: 0.5rem;
        }
        .viewport {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        canvas {
          display: block;
          max-width: 100%;
          max-height: 100%;
        }
        }
      `}</style>
    </div>
  );
};

export default OrientationDisplayPanel;
