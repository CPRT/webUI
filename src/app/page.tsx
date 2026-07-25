'use client';

import Layout from '@/components/Layout';

const names = ["Default", "Arm Operation", "Debug", "Auxiliary", "Science"];
const colors = ['#0070f3', '#28a745', '#dc3545', '#ffc107', '#17a2b8'];

const layouts = [
  {
    direction: 'row',
    first: {
      direction: 'column',
      first: 'mapView:1',
      second: {
        direction: 'row',
        first: {
          direction: 'row',
          first: {
            direction: 'column',
            first: 'antennaControlPanel:2',
            second: {
              direction: 'column',
              first: 'motorStatusPanel:3',
              second: 'nodeStatusPanel:4',
              splitPercentage: 50,
            },
            splitPercentage: 35,
          },
          second: 'networkHealthMonitor:5',
        },
        second: 'waypointList:6',
        splitPercentage: 55,
      },
      splitPercentage: 55,
    },
    second: {
      direction: 'column',
      first: 'videoControls:7',
      second: {
        direction: 'row',
        first: 'pdbRails:8',
        second: 'armControlPanel:9',
        splitPercentage: 50,
      },
      splitPercentage: 60,
    },
    splitPercentage: 60,
  },
  {
    direction: 'row',
    first: {
      direction: 'column',
      first: 'mapView:1',
      second: 'waypointList:2',
      splitPercentage: 60,
    },
    second: {
      direction: 'column',
      first: 'videoControls:3',
      second: 'armControlPanel:4',
      splitPercentage: 50,
    },
    splitPercentage: 60,
  },
  {
    direction: 'row',
    first: {
      direction: 'column',
      first: 'motorStatusPanel:1',
      second: 'pdbRails:2',
      splitPercentage: 60,
    },
    second: {
      direction: 'row',
      first: {
        direction: 'column',
        first: 'networkHealthMonitor:3',
        second: 'rosMonitor:4',
        splitPercentage: 60
      },
      second: {
        direction: 'column',
        first: 'antennaControlPanel:5',
        second: 'nodeStatusPanel:6',
        splitPercentage: 20,
      },
      splitPercentage: 50,
    },
    splitPercentage: 35,
  },
  {
    direction: 'row',
    first: 'webRTCClient:1',
    second: 'orientationDisplay:2',
    splitPercentage: 50
  },
  {
    direction: 'row',
    first: {
      direction: 'column',
      first: 'mapView:1',
      second: 'scienceControlPanel:2',
      splitPercentage: 50,
    },
    second: {
      direction: 'column',
      first: 'videoControls:3',
      second: 'scienceSensorPanel:4',
      splitPercentage: 65,
    },
    splitPercentage: 60,
  },
];

const HomePage = () => {
  return (
    <Layout>
      <div className="home">
        <div className="preset-section">
          <h1>Dashboard Presets</h1>

          <div className="preset-links">
            {names.map((name, idx) => (
              <a
                key={name}
                href={"/dashboard?layout=" + encodeURIComponent(JSON.stringify(layouts[idx]))}
                style={{
                  borderColor: colors[idx],
                  '--hover-color': colors[idx],
                } as React.CSSProperties}
              >
                {name}
              </a>
            ))}
          </div>
        </div>

        <div className="tool-section">
          <h1>Tools</h1>

          <a href="/launch" >
            Launch
          </a>
          <a href="http://192.168.0.2">
            Base Station AP
          </a>
          <a href="http://192.168.0.3">
            Rover AP
          </a>
        </div>
      </div>

      <style jsx>{`
        .home {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          font-weight: bold;
        }

        .preset-section,
        .tool-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .preset-links {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }

        h1 {
          color: #222;
          margin: 10px;
          text-align: center;
        }

        /* Dashboard preset boxes */
        .home a {
          height: 100px;
          width: 100px;
          margin: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          border-radius: 5px;
          border: 5px solid #fff;
          background: #222;
          color: #fff;
          transition: background 0.2s, color 0.2s;
        }

        .home a:hover {
          background: #000;
          color: var(--hover-color);
          text-decoration: none;
        }

        .tool-section a {
          height: 70px;
          width: 220px;
          border-radius: 8px;
          border: 5px solid #b6b6b6;
        }

        .tool-section a:hover {
          background: #000;
          color: #b6b6b6;
          text-decoration: none;
        }
      `}</style>
    </Layout>
  );
};

export default HomePage;