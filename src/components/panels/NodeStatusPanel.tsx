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
  const [staleTime, setStaleTime] = useState<number>(0);

  useEffect(() => {
    if (!ros) return;

    const topic = new ROSLIB.Topic({
      ros,
      name: '/system/nodes',
      messageType: 'interfaces/msg/NodeList',
    });

    const handleMsg = (msg: any) => {
      try {
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
          for (const name of msg.nodes) {
            updated.set(name, {
              online: true,
              lastSeen: now,
            });
          }

          return updated;
        });
        setStaleTime(2);
      } catch (e) {
        console.error('Failed to parse node list:', e);
      }
    };

    topic.subscribe(handleMsg);

    return () => {
      topic.unsubscribe(handleMsg);
    };
  }, [ros]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStaleTime(prev => Math.max(-1, prev - 0.1));
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  const sortedNodes = Array.from(nodes.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const stale = staleTime < 0;

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

            const status = stale
              ? 'STALE'
              : info.online
                ? 'ONLINE'
                : offline
                  ? 'OFFLINE'
                  : 'UNKNOWN';

            const color = stale
              ? '#ffc107'
              : info.online
                ? '#22c55e'
                : offline
                  ? '#ef4444'
                  : '#6c757d';

            return (
              <tr key={name}>
                <td>{name}</td>

                <td>
                  <span
                    className="status-led"
                    style={{ backgroundColor: color }}
                  />
                  <span style={{ paddingLeft: '8px' }}>{status}</span>
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
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: auto;
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

        .node-table th {
          text-align: left;
          font-weight: 600;
        }

        .node-table td {
          border-bottom: 1px solid #333;
        }

        .node-table tbody tr:hover {
          background-color: #262626;
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
