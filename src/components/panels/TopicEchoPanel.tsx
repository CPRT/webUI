'use client';

import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

type TopicInfo = {
  name: string;
  type: string;
};

type TopicsResponse = {
  topics: string[];
  types: string[];
};

const TopicEchoPanel: React.FC = () => {
  const { ros } = useROS();

  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [latestMessage, setLatestMessage] = useState<string>('');
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [messageTime, setMessageTime] = useState<number | null>(null);

  useEffect(() => {
    if (!ros) {
      setTopics([]);
      setSelectedTopic('');
      setLatestMessage('');
      setMessageTime(null);
      setLoadingTopics(false);
      return;
    }

    setLoadingTopics(true);

    const service = new ROSLIB.Service({
      ros,
      name: '/system/get_topics',
      serviceType: 'interfaces/srv/GetTopics',
    });

    let cancelled = false;

    service.callService(
      new ROSLIB.ServiceRequest({}),
      response => {
        if (cancelled) return;
        const result = response as unknown as TopicsResponse;

        const topicList = result.topics
          .map((name, index) => ({
            name,
            type: result.types[index],
          }))
          .filter(topic => topic.type)
          .sort((a, b) => a.name.localeCompare(b.name));

        setTopics(topicList);
        setLoadingTopics(false);
      },
      error => {
        if (cancelled) return;
        console.error('Failed to retrieve ROS topics:', error);
        setTopics([]);
        setLoadingTopics(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [ros]);

  useEffect(() => {
    if (!ros || !selectedTopic) {
      setLatestMessage('');
      setMessageTime(null);
      return;
    }

    const topicInfo = topics.find(topic => topic.name === selectedTopic);

    if (!topicInfo) return;

    setLatestMessage('');
    setMessageTime(null);

    const topic = new ROSLIB.Topic({
      ros,
      name: topicInfo.name,
      messageType: topicInfo.type,
      throttle_rate: 100,
      queue_length: 1,
    });

    const handleMessage = (message: unknown) => {
      try {
        setLatestMessage(JSON.stringify(message, null, 2));
      } catch {
        setLatestMessage(String(message));
      }

      setMessageTime(Date.now());
    };

    topic.subscribe(handleMessage);

    return () => {
      topic.unsubscribe(handleMessage);
    };
  }, [ros, selectedTopic, topics]);

  const selectedTopicInfo = topics.find(
    topic => topic.name === selectedTopic
  );

  return (
    <div className="topic-echo-panel">
      <div className="topic-controls">
        <label htmlFor="topic-select">Topic</label>

        <select
          id="topic-select"
          value={selectedTopic}
          disabled={!ros || loadingTopics}
          onChange={event => setSelectedTopic(event.target.value)}
        >
          <option value="">
            {loadingTopics ? 'Loading topics...' : 'Select a topic'}
          </option>

          {topics.map(topic => (
            <option
              key={`${topic.name}:${topic.type}`}
              value={topic.name}
            >
              {topic.name}
            </option>
          ))}
        </select>
      </div>

      <div className="topic-details">
        <span>
          Type: {selectedTopicInfo?.type ?? '-'}
        </span>

        <span>
          Last Message:{' '}
          {messageTime
            ? new Date(messageTime).toLocaleTimeString()
            : '-'}
        </span>
      </div>

      <textarea
        className="message-output"
        value={latestMessage}
        readOnly
        spellCheck={false}
        placeholder={
          selectedTopic
            ? 'Waiting for message...'
            : 'Select a topic to begin'
        }
      />

      <style jsx>{`
        .topic-echo-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        .topic-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #2d2d2d;
          border-bottom: 2px solid #444;
        }

        .topic-controls label {
          font-weight: 600;
        }

        .topic-controls select {
          background: #3b3b3b;
          color: #f1f1f1;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 4px 8px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }

        .topic-controls select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .topic-details {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 8px;
          color: #aaa;
          font-size: 0.85rem;
          border-bottom: 1px solid #333;
        }

        .message-output {
          background: #151515;
          color: #f1f1f1;
          border: none;
          padding: 8px;
          flex: 1;
          width: 100%;
          min-height: 0;
          box-sizing: border-box;
          resize: none;
          font-family: monospace;
          font-size: 0.9rem;
          line-height: 1.4;
          white-space: pre;
          overflow: auto;
        }

        .message-output:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default TopicEchoPanel;