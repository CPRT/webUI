'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ROSLIB from 'roslib';
import URDFLoader, { URDFRobot } from 'urdf-loader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useROS } from '@/ros/ROSContext';

interface TransformData {
  translation: THREE.Vector3;
  rotation: THREE.Quaternion;
}

interface TransformEdge {
  parent: string;
  child: string;
  transform: TransformData;
}

const FIXED_FRAME = 'map';
const ROOT_FRAME = 'base_link';
const UPDATE_RATE_HZ = 5;
const THROTTLE_MS = 1000 / UPDATE_RATE_HZ;

const normalizeFrame = (frame: string): string => {
  return frame.replace(/^\/+/, '');
};

const invertTransform = (transform: TransformData): TransformData => {
  const rotation = transform.rotation.clone().invert();

  return {
    translation: transform.translation.clone().negate().applyQuaternion(rotation),
    rotation,
  };
};

const composeTransforms = (
  first: TransformData,
  second: TransformData,
): TransformData => {
  return {
    translation: first.translation
      .clone()
      .add(second.translation.clone().applyQuaternion(first.rotation)),
    rotation: first.rotation.clone().multiply(second.rotation),
  };
};

const findTransform = (
  edges: Map<string, TransformEdge>,
  sourceFrame: string,
  targetFrame: string,
): TransformData | null => {
  const source = normalizeFrame(sourceFrame);
  const target = normalizeFrame(targetFrame);

  if (source === target) {
    return {
      translation: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
    };
  }

  const adjacency = new Map<
    string,
    Array<{
      frame: string;
      transform: TransformData;
    }>
  >();

  edges.forEach(edge => {
    const parentConnections = adjacency.get(edge.parent) ?? [];
    parentConnections.push({
      frame: edge.child,
      transform: edge.transform,
    });
    adjacency.set(edge.parent, parentConnections);

    const childConnections = adjacency.get(edge.child) ?? [];
    childConnections.push({
      frame: edge.parent,
      transform: invertTransform(edge.transform),
    });
    adjacency.set(edge.child, childConnections);
  });

  const identity: TransformData = {
    translation: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
  };

  const queue: Array<{
    frame: string;
    transform: TransformData;
  }> = [
    {
      frame: source,
      transform: identity,
    },
  ];

  const visited = new Set<string>([source]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    const connections = adjacency.get(current.frame) ?? [];

    for (const connection of connections) {
      if (visited.has(connection.frame)) {
        continue;
      }

      const transform = composeTransforms(
        current.transform,
        connection.transform,
      );

      if (connection.frame === target) {
        return transform;
      }

      visited.add(connection.frame);
      queue.push({
        frame: connection.frame,
        transform,
      });
    }
  }

  return null;
};

const OrientationDisplayPanel: React.FC = () => {
  const { ros } = useROS();

  const containerRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<URDFRobot | null>(null);
  const robotRootRef = useRef<THREE.Group | null>(null);

  const dynamicTransformsRef = useRef<Map<string, TransformEdge>>(
    new Map(),
  );

  const staticTransformsRef = useRef<Map<string, TransformEdge>>(
    new Map(),
  );

  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.01,
      1000,
    );

    camera.up.set(0, 0, 1);
    camera.position.set(4, -4, 3);
    camera.lookAt(0, 0, 0.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(
      container.clientWidth,
      container.clientHeight,
    );

    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(
      camera,
      renderer.domElement,
    );

    controls.enableDamping = true;
    controls.target.set(0, 0, 0.5);

    const hemisphereLight = new THREE.HemisphereLight(
      0xffffff,
      0x333333,
      2,
    );

    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      3,
    );

    directionalLight.position.set(5, -5, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const grid = new THREE.GridHelper(20, 40);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    const axes = new THREE.AxesHelper(1);
    scene.add(axes);

    /*
     * This group receives the map -> base_link transform.
     * The parsed URDF is attached below it.
     */
    const robotRoot = new THREE.Group();
    robotRoot.matrixAutoUpdate = true;
    scene.add(robotRoot);
    robotRootRef.current = robotRoot;

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        return;
      }

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });

    resizeObserver.observe(container);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const allTransforms = new Map<string, TransformEdge>([
        ...staticTransformsRef.current,
        ...dynamicTransformsRef.current,
      ]);

      const rootTransform = findTransform(
        allTransforms,
        FIXED_FRAME,
        ROOT_FRAME,
      );

      if (robotRootRef.current) {
        if (rootTransform) {
          robotRootRef.current.position.copy(rootTransform.translation);
          robotRootRef.current.quaternion.copy(rootTransform.rotation);
        } else {
          robotRootRef.current.position.set(0, 0, 0);
          robotRootRef.current.quaternion.identity();
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      resizeObserver.disconnect();
      controls.dispose();

      robotRef.current?.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach(material => {
            material.dispose();
          });
        }
      });

      robotRoot.clear();
      scene.remove(robotRoot);

      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }

      robotRef.current = null;
      robotRootRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ros || !robotRootRef.current) return;

    let descriptionLoaded = false;

    const robotDescriptionTopic = new ROSLIB.Topic({
      ros,
      name: '/robot_description',
      messageType: 'std_msgs/String',
    });

    const handleRobotDescription = (message: any) => {
      if (descriptionLoaded || !message.data) {
        return;
      }

      descriptionLoaded = true;

      const loader = new URDFLoader();
      loader.parseVisual = false;
      loader.parseCollision = true;

      /*
       * Converts:
       * package://rover_description/meshes/chassis.stl
       * into:
       * /ros-packages/rover_description/meshes/chassis.stl
       * 
       * Then stores the file in the public/ros-packages/rover_description/meshes/ directory.
       */
      loader.packages = packageName => {
        return `/ros-packages/${packageName}`;
      };

      let robot: URDFRobot;

      try {
        robot = loader.parse(message.data);
      } catch (error) {
        console.error('Failed to parse robot URDF:', error);
        return;
      }

      robot.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      robotRootRef.current?.clear();
      robotRootRef.current?.add(robot);
      robotRef.current = robot;

      robot.updateMatrixWorld(true);

      const boundingBox = new THREE.Box3().setFromObject(robot);

      if (!boundingBox.isEmpty()) {
        const center = boundingBox.getCenter(
          new THREE.Vector3(),
        );

        /*
         * Keep the URDF root located at base_link. Do not center the
         * actual model, because that would make its TF position wrong.
         */
        console.log('URDF bounds center:', center);
      }

      /*
       * robot_description should not normally change at runtime.
       */
      robotDescriptionTopic.unsubscribe(
        handleRobotDescription,
      );
    };

    robotDescriptionTopic.subscribe(handleRobotDescription);

    return () => {
      robotDescriptionTopic.unsubscribe(
        handleRobotDescription,
      );
    };
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const jointStateTopic = new ROSLIB.Topic({
      ros,
      name: '/joint_states',
      messageType: 'sensor_msgs/JointState',
      throttle_rate: THROTTLE_MS,
      queue_length: 1,
    });

    const handleJointState = (message: {
      name?: string[];
      position?: number[];
    }) => {
      const robot = robotRef.current;

      if (!robot) {
        return;
      }

      const names = message.name ?? [];
      const positions = message.position ?? [];
      const count = Math.min(names.length, positions.length);

      for (let index = 0; index < count; index += 1) {
        const jointName = names[index];
        const position = positions[index];

        if (!Number.isFinite(position)) {
          continue;
        }

        if (robot.joints[jointName]) {
          robot.setJointValue(jointName, position);
        }
      }
    };

    jointStateTopic.subscribe(handleJointState);

    return () => {
      jointStateTopic.unsubscribe(handleJointState);
    };
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const tfTopic = new ROSLIB.Topic({
      ros,
      name: '/tf',
      messageType: 'tf2_msgs/TFMessage',
      throttle_rate: THROTTLE_MS,
      queue_length: 1,
    });

    const tfStaticTopic = new ROSLIB.Topic({
      ros,
      name: '/tf_static',
      messageType: 'tf2_msgs/TFMessage',
      queue_length: 1,
    });

    const updateTransforms = (
      message: any,
      destination: Map<string, TransformEdge>,
    ) => {
      for (const stampedTransform of message.transforms ?? []) {
        const parent = normalizeFrame(
          stampedTransform.header.frame_id,
        );

        const child = normalizeFrame(
          stampedTransform.child_frame_id,
        );

        if (!parent || !child) {
          continue;
        }

        const translation =
          stampedTransform.transform.translation;

        const rotation =
          stampedTransform.transform.rotation;

        const quaternion = new THREE.Quaternion(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w,
        );

        if (quaternion.lengthSq() === 0) {
          quaternion.identity();
        } else {
          quaternion.normalize();
        }

        destination.set(child, {
          parent,
          child,
          transform: {
            translation: new THREE.Vector3(
              translation.x,
              translation.y,
              translation.z,
            ),
            rotation: quaternion,
          },
        });
      }
    };

    const handleTF = (message: any) => {
      updateTransforms(
        message,
        dynamicTransformsRef.current,
      );
    };

    const handleStaticTF = (message: any) => {
      updateTransforms(
        message,
        staticTransformsRef.current,
      );
    };

    tfTopic.subscribe(handleTF);
    tfStaticTopic.subscribe(handleStaticTF);

    return () => {
      tfTopic.unsubscribe(handleTF);
      tfStaticTopic.unsubscribe(handleStaticTF);

      dynamicTransformsRef.current.clear();
      staticTransformsRef.current.clear();
    };
  }, [ros]);

  return (
    <div className="orientation-panel">
      <div className="viewport" ref={containerRef} />

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

        .viewport {
          width: 100%;
          height: 100%;
          min-height: 300px;
          position: relative;
          overflow: hidden;
        }

        .viewport :global(canvas) {
          display: block;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default OrientationDisplayPanel;