'use client';

import React from 'react';

export interface PanelItem {
  key: string;
  label: string;
  Component: React.ComponentType;
}

interface PanelGridProps {
  panels: PanelItem[];
}

const PanelGrid: React.FC<PanelGridProps> = ({ panels }) => {
  return (
    <div className="gridContainer">
      {panels.map((panel) => {
        const PanelComponent = panel.Component;
        return (
          <div key={panel.key} className="panel">
            <PanelComponent />
          </div>
        );
      })}
      <style jsx>{`
        .gridContainer {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          grid-gap: 1rem;
          height: 100%;
        }
        .panel {
          border: 1px solid #ccc;
          border-radius: 8px;
          overflow: hidden;
          background-color: #fafafa;
        }
      `}</style>
    </div>
  );
};

export default PanelGrid;
