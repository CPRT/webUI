// telemetryPanels.ts
import TelemetryGraph from "../TelemetryGraph";


export const CO2Graph: React.FC = () => {
  return (
    <TelemetryGraph
      topic="/co2"
      label="CO2 Level"
      color="#00d4ff"
    />
  );
};