'use client';

import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

type NodeInfo = {
  online: boolean;
  lastSeen: number;
};

const NodeStatusPanel: React.FC = () => {
  const { ros } = useROS();

  const [nodes, setNodes] = useState<Map<string, NodeInfo>>(new Map());

  useEffect(() => {
    if (!ros) return;

    const topic = new ROSLIB.Topic({
      ros,
      name: '/system/nodes',
      messageType: 'std_msgs/msg/String',
    });

    const handleMsg = (msg: any) => {
      try {
        const data = JSON.parse(msg.data) as { nodes: string[] };
        const now = Date.now();

        setNodes(prev => {
          const updated = new Map(prev);

          // mark everything offline first
          for (const [name, info] of updated) {
            updated.set(name, {
              ...info,
              online: false,
            });
          }

          // mark active nodes online
          for (const name of data.nodes) {
            updated.set(name, {
              online: true,
              lastSeen: now,
            });
          }

          return updated;
        });
      } catch (e) {
        console.error('Failed to parse node list:', e);
      }
    };

    topic.subscribe(handleMsg);

    return () => {
      topic.unsubscribe(handleMsg);
    };
  }, [ros]);

  const sortedNodes = Array.from(nodes.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="node-panel">
      <table className="node-table">
        <thead>
          <tr>
            <th>Node</th>
            <th>Status</th>
            <th>Last Seen</th>
          </tr>
        </thead>

        <tbody>
          {sortedNodes.map(([name, info]) => {
            const age = Date.now() - info.lastSeen;
            const offline = !info.online && age > 2000;

            return (
              <tr key={name}>
                <td>{name}</td>

                <td>
                  <span
                    className="status-led"
                    style={{
                      backgroundColor: info.online
                        ? '#22c55e'
                        : offline
                          ? '#ef4444'
                          : '#6b7280',
                    }}
                  />
                  <span style={{ paddingLeft: 8 }}>
                    {info.online ? 'Online' : offline ? 'Offline' : 'Unknown'}
                  </span>
                </td>

                <td>
                  {info.online
                    ? 'Now'
                    : `${Math.floor(age / 1000)}s ago`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style jsx>{`
        .node-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          height: 100%;
          overflow: auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .node-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .node-table thead {
          background: #2d2d2d;
          border-bottom: 2px solid #444;
        }

        .node-table th,
        .node-table td {
          text-align: left;
          padding: 8px;
          border-bottom: 1px solid #333;
        }

        .node-table tbody tr:hover {
          background: #262626;
        }

        .status-led {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default NodeStatusPanel;