"use client";

import React, { useState } from "react";
import CameraSourceDropdown from "./CameraSourceDropdown";
import { VideoOutRequest, VideoSource } from "./WebRTCClientPage";


interface CustomPresetFormProps {
  onSubmit: (preset: VideoOutRequest) => void;
}

const VideoCustomPresetForm: React.FC<CustomPresetFormProps> = ({ onSubmit }) => {
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
  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    color: "#aaa",
    fontSize: "0.85rem",
    flex: "1 1 0",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    borderRadius: "0.25rem",
    border: "1px solid #444",
    background: "#1e1e1e",
    color: "#f1f1f1",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "0.75rem",
        background: "#2d2d2d",
        border: "1px solid #444",
        borderRadius: "0.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header (fixed) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderBottom: "1px solid #444",
          paddingBottom: "0.3rem",
          flex: "0 0 auto",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#f1f1f1" }}>
          Custom Preset
        </h2>
        <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
          Sources: {sources.length}
        </span>
      </div>

      {/* Sources list (scrolls) */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0, // IMPORTANT: enables scrolling inside flex column
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          paddingRight: "0.25rem", // little gutter so scrollbar doesn't overlap content
        }}
      >
        {sources.map((source, index) => (
          <div
            key={index}
            style={{
              position: "relative",
              padding: "0.75rem",
              border: "1px solid #444",
              borderRadius: "0.5rem",
              background: "#2a2a2a",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#f1f1f1" }}>
              Source {index + 1}
            </h3>

            <label style={fieldStyle}>
              Name
              <div
                style={{
                  border: "1px solid #444",
                  borderRadius: "0.25rem",
                  background: "#1e1e1e",
                  padding: "0.15rem",
                }}
              >
                <CameraSourceDropdown
                  onChange={(v) => handleSourceChange(index, "name", v)}
                />
              </div>
            </label>

            <div style={rowStyle}>
              <label style={fieldStyle}>
                Width
                <input
                  type="number"
                  value={source.width}
                  onChange={(e) => handleSourceChange(index, "width", e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                Height
                <input
                  type="number"
                  value={source.height}
                  onChange={(e) => handleSourceChange(index, "height", e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={rowStyle}>
              <label style={fieldStyle}>
                Origin X
                <input
                  type="number"
                  value={source.origin_x}
                  onChange={(e) => handleSourceChange(index, "origin_x", e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                Origin Y
                <input
                  type="number"
                  value={source.origin_y}
                  onChange={(e) => handleSourceChange(index, "origin_y", e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>

          <button
            type="button"
            onClick={() => removeSource(index)}
            title="Remove source"
            style={{
              position: "absolute",
              top: "0.4rem",
              right: "0.4rem",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              border: "1px solid #555",
              background: "#A03232",
              color: "#aaa",
              fontSize: "14px",
              lineHeight: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#A03232')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ×
          </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flex: "0 0 auto" }}>
        <button
          type="button"
          onClick={addSource}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#005bb5")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0070f3")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Add Source
        </button>

        <button
          type="submit"
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1e7e34")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#28a745")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Submit Preset
        </button>
      </div>
    </form>
  );
};

export default VideoCustomPresetForm;
