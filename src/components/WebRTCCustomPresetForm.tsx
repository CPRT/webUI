"use client";

import React, { useState } from "react";
import CameraSourceDropdown from "./CameraSourceDropdown";
import { VideoOutRequest, VideoSource } from "./WebRTCClientPage";


interface CustomPresetFormProps {
  onSubmit: (preset: VideoOutRequest) => void;
}

const WebRTCCustomPresetForm: React.FC<CustomPresetFormProps> = ({ onSubmit }) => {
  const [sources, setSources] = useState<VideoSource[]>([
    { name: "Source1", width: 100, height: 100, origin_x: 0, origin_y: 0 },
  ]);

  const handleSourceChange = (index: number, field: keyof VideoSource, value: string | number) => {
    const updatedSources = [...sources];
    if (field === "name") {
      updatedSources[index][field] = value as string;
    } else {
      updatedSources[index][field] = Number(value);
    }
    setSources(updatedSources);
  };

  const addSource = () => {
    setSources([
      ...sources,
      { name: `Source${sources.length + 1}`, width: 100, height: 100, origin_x: 0, origin_y: 0 },
    ]);
  };

  const removeSource = (index: number) => {
    const updatedSources = sources.filter((_, i) => i !== index);
    setSources(updatedSources);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const preset: VideoOutRequest = {
      num_sources: sources.length,
      sources,
    };
    onSubmit(preset);
  };

  return (
    <form
      onSubmit={handleSubmit}
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
      <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Custom Preset</h2>

      {sources.map((source, index) => (
        <div
          key={index}
          style={{
            padding: "0.75rem",
            border: "1px solid #ddd",
            borderRadius: "0.5rem",
            background: "#fff",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <h3 style={{ flexBasis: "100%", margin: 0 }}>Source {index + 1}</h3>
          <label style={{ flex: "1 1 45%" }}>
            Name
            <CameraSourceDropdown
              onChange={(source) => handleSourceChange(index, "name", source)}
            />
          </label>
          <label style={{ flex: "1 1 45%" }}>
            Width
            <input
              type="number"
              value={source.width}
              onChange={(e) => handleSourceChange(index, "width", e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem" }}
            />
          </label>
          <label style={{ flex: "1 1 45%" }}>
            Height
            <input
              type="number"
              value={source.height}
              onChange={(e) => handleSourceChange(index, "height", e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem" }}
            />
          </label>
          <label style={{ flex: "1 1 45%" }}>
            Origin X
            <input
              type="number"
              value={source.origin_x}
              onChange={(e) => handleSourceChange(index, "origin_x", e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem" }}
            />
          </label>
          <label style={{ flex: "1 1 45%" }}>
            Origin Y
            <input
              type="number"
              value={source.origin_y}
              onChange={(e) => handleSourceChange(index, "origin_y", e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem" }}
            />
          </label>

          {/* Remove Source Button */}
          <button
            type="button"
            onClick={() => removeSource(index)}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              background: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              flexBasis: "100%",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#A03232')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Remove Source
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addSource}
        style={{
          padding: "0.75rem",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#005bb5')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0070f3')}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Add Source
      </button>

      <button
        type="submit"
        style={{
          padding: "0.75rem",
          background: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e7e34')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Submit Preset
      </button>
    </form>
  );
};

export default WebRTCCustomPresetForm;
