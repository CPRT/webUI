// telemetryPanels.ts
import TelemetryGraph from "../TelemetryGraph";


export const CO2Graph: React.FC = () => {
  return (
    <TelemetryGraph
      topic="/science/sensor2"
      label="CO2 Level"
      color="#ffffff"
    />
  );
};

export const MethaneGraph: React.FC = () => {
  return (
    <TelemetryGraph
      topic="/science/sensor1"
      label="Methane Level"
      color="#ffffff"
    />
  );
};