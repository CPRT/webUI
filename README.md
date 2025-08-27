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

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm (comes with Node.js)
- ROS2 system with [rosbridge_suite](https://github.com/RobotWebTools/rosbridge_suite) running and accessible

## Installation

1. **Clone the Repository:**

   ```bash
   git clone git@github.com:CPRT/webUI.git
   cd webUI
   ```

2. **Install Dependencies:**

   ```bash
   npm install --legacy-peer-deps
   ```

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to:  
[http://localhost:3000/dashboard](http://localhost:3000/dashboard)  
(or use the host IP if running on a remote machine).

### Production Mode

Build and start the application:

```bash
npm run build
npm run start
```

Access the dashboard at:  
[http://localhost:3000/dashboard](http://localhost:3000/dashboard)  
(or use the host IP of the machine running the web app).

## Docker

You can run the dashboard using Docker for easier deployment.

### Build the Docker image

```bash
./build.sh
# Or
docker build -t cprtsoftware/web-ui:latest .
```

### Pull the Docker image
```bash
docker pull cprtsoftware/web-ui:latest
```

### Run the container

```bash
./start.sh
# Or
docker run --name cprt-webserver -p 3000:3000 cprtsoftware/web-ui:latest
```

- The dashboard will be available at [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
- To connect to a remote ROS2 system, ensure the container can reach your `rosbridge_server`.

---

## Configuration

### ROS Connection

- The dashboard uses a `ROSContext` to connect to your ROS2 system.
- Ensure your `rosbridge_server` is running and accessible from the machine running this web app.
- Default connection settings can be updated in `/src/contexts/ROSContext.tsx`.

### WebRTC & Telemetry

- Update configuration in `WebRTCClientPanel.tsx` and `SystemTelemetryPanel.tsx` as needed (e.g., signaling URLs, message types, topic names).

## External Libraries

- **react-mosaic-component:** Resizable, modular dashboard layout.
- **Recharts:** Real-time graphing of system telemetry data.
- **ROSLIB:** Communication with ROS topics and services.
- **Leaflet & React-Leaflet:** Interactive map views.

## Project Structure

```
/src/components/      # All React components (WebRTC, maps, telemetry, node management, etc.)
/src/contexts/        # Context providers for ROS and Waypoints
/src/MosaicDashboard.tsx  # Main dashboard layout integrating mosaic panels
```

## Troubleshooting

### Peer Dependency Issues

If you experience issues with peer dependencies during installation, ensure you are using the `--legacy-peer-deps` flag with npm.

### ROS Connection

- Verify that your ROS2 system and `rosbridge_server` are running and accessible.
- Check that the correct topics (`/system_telemetry`, `/fix`, etc.) are being published.
