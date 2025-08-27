# ROS2 Offline Dashboard

A web dashboard for monitoring and interacting with your ROS2-powered rover. This dashboard integrates various panels—including a map view, telemetry, video stream, node manager, waypoint list, and more—using a Mosaic layout for a flexible, modular experience.

## Features

- **Mosaic Dashboard:** Dynamic, resizable panels for map view, video stream, node management, telemetry, and waypoint list.
- **ROS2 Integration:** Connects to ROS2 topics and services for:
  - System telemetry (CPU, Memory, GPU usage).
  - GPS fixes and waypoint management.
  - WebRTC video streaming.
- **Modern, Responsive UI:** Clean dark-theme design that scales dynamically with the mosaic containers.
- **Real-Time Graphs:** Uses Recharts to graph system telemetry data over time.
- **WebRTC Client:** Robust video stream panel with live statistics and controls.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- npm (comes with Node.js)

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/ros2-offline-dashboard.git
   cd ros2-offline-dashboard
   ```

2. **Install Dependencies:**

Use the following command to install dependencies with the --legacy-peer-deps flag (this is required to handle legacy peer dependencies):

```bash
npm install --legacy-peer-deps
```
## Running the Application
### Development Mode
For local development, you can start the development server:

```bash
npm run dev
```
Then open your browser and navigate to:
`http://localhost:3000/dashboard`
(or use the host IP if running on a remote machine).

### Stable Build & Production Mode
To get a stable version running:

Build the Application:

```bash
npm run build
```
Start the Application:

```bash
npm run start
```
Access the dashboard at:
`http://localhost:3000/dashboard`
(or use the host IP of the machine running the web app).

## Configuration
### ROS Connection:
The dashboard uses the ROSContext to connect to your ROS system. Ensure your rosbridge srever is running and accessible from the machine running this web app.

### WebRTC & Telemetry:
Update the configuration in WebRTCClientPanel.tsx and SystemTelemetryPanel.tsx as needed (e.g., signaling URLs, message types).

### External Libraries
The project uses the following external libraries to enhance functionality and aesthetics:

react-mosaic-component: For building the resizable, modular dashboard layout.
Recharts: For real-time graphing of system telemetry data.
ROSLIB: For communicating with ROS topics and services.
Leaflet & React-Leaflet: For interactive map views.
## Project Structure
/src/components/
Contains all React components, including panels for WebRTC, maps, telemetry, and node management.

/src/contexts/
Contains context providers for ROS and Waypoints.

MosaicDashboard.tsx
Main dashboard layout file integrating the mosaic panels.

## Troubleshooting
### Peer Dependency Issues:
If you experience issues with peer dependencies during installation, ensure you are using the --legacy-peer-deps flag with npm.

### ROS Connection:
Verify that your ROS master is running and accessible. Check that the correct topics (/system_telemetry, /fix, etc.) are being published.

License
MIT License


