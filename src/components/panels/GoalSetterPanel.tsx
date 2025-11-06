"use client";
import React, { useMemo, useRef, useState } from "react";
import ROSLIB from "roslib";
import { useROS } from "@/ros/ROSContext";

// --- Helpers ---
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const isFiniteNum = (v: string) => v.trim() !== "" && isFinite(Number(v));
const fmt = (n: number, dp: number) => (Number.isFinite(n) ? n.toFixed(dp) : "");

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function yawToQuat(yawRad: number) {
  const half = yawRad / 2.0;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}

type Mode = "geodetic" | "map";

type NavigateFeedback = any; // nav2_msgs/action/NavigateToPose_Feedback (opaque to the UI)

type NavigateResult = any; // nav2_msgs/action/NavigateToPose_Result

const DEFAULT_FRAME = "map";
const NAV2_ACTION = "/navigate_to_pose";
const NAV2_ACTION_TYPE = "nav2_msgs/action/NavigateToPose"; // If your bridge expects a different string, adjust here
const FROM_LL_SERVICE = "/fromLL"; // robot_localization FromLL service
const FROM_LL_TYPE = "robot_localization/srv/FromLL"; // Some bridges use "robot_localization/FromLL"

const GoalSetterPanel: React.FC = () => {
  const { ros } = useROS();

  // --- UI state ---
  const [mode, setMode] = useState<Mode>("geodetic");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const [mapX, setMapX] = useState<string>("");
  const [mapY, setMapY] = useState<string>("");
  const [yawDeg, setYawDeg] = useState<string>("0");

  const [status, setStatus] = useState<string>("");
  const [feedback, setFeedback] = useState<NavigateFeedback | null>(null);
  const [result, setResult] = useState<NavigateResult | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const actionClient = useMemo(() => {
    if (!ros) return null;
    return new ROSLIB.ActionClient({
      ros,
      serverName: NAV2_ACTION,
      actionName: NAV2_ACTION_TYPE,
    });
  }, [ros]);

  const goalRef = useRef<ROSLIB.Goal | null>(null);

  function ensureROS() {
    if (!ros) {
      throw new Error("ROS is not connected");
    }
  }

  // --- Formatting handlers (dynamic, onBlur normalization) ---
  const onBlurLat = () => {
    if (!isFiniteNum(latitude)) return;
    const v = clamp(parseFloat(latitude), -90, 90);
    setLatitude(fmt(v, 6));
  };
  const onBlurLon = () => {
    if (!isFiniteNum(longitude)) return;
    // normalize to [-180,180]
    let v = parseFloat(longitude);
    v = ((v + 180) % 360 + 360) % 360 - 180;
    setLongitude(fmt(v, 6));
  };
  const onBlurYaw = () => {
    if (!isFiniteNum(yawDeg)) return;
    let v = parseFloat(yawDeg);
    // wrap to [-180,180]
    v = ((v + 180) % 360 + 360) % 360 - 180;
    setYawDeg(fmt(v, 1));
  };
  const onBlurX = () => {
    if (!isFiniteNum(mapX)) return;
    setMapX(fmt(parseFloat(mapX), 3));
  };
  const onBlurY = () => {
    if (!isFiniteNum(mapY)) return;
    setMapY(fmt(parseFloat(mapY), 3));
  };

  async function callFromLL(lat: number, lon: number) {
    ensureROS();
    const service = new ROSLIB.Service({
      ros: ros!,
      name: FROM_LL_SERVICE,
      serviceType: FROM_LL_TYPE,
    });

    const req: any = {
      latitude: lat,
      longitude: lon,
      altitude: 0.0,
    };

    return new Promise<{ x: number; y: number; z: number }>((resolve, reject) => {
      service.callService(
        new ROSLIB.ServiceRequest(req),
        (res: any) => {
          if (!res || !res.map_point) {
            reject(new Error("/fromLL returned no map_point"));
            return;
          }
          resolve({ x: res.map_point.x, y: res.map_point.y, z: res.map_point.z });
        },
        (err: any) => reject(err)
      );
    });
  }

  function sendNavigateGoal(pose: { x: number; y: number; z: number; yawRad: number }) {
    if (!actionClient) {
      throw new Error("Action client is not available (ROS not connected?)");
    }

    const quat = yawToQuat(pose.yawRad);

    // Build NavigateToPose goal
    const goalMessage: any = {
      pose: {
        header: {
          frame_id: DEFAULT_FRAME,
          stamp: { sec: 0, nanosec: 0 },
        },
        pose: {
          position: { x: pose.x, y: pose.y, z: pose.z },
          orientation: quat,
        },
      },
    };

    const goal = new ROSLIB.Goal({ actionClient, goalMessage });
    goalRef.current = goal;

    // Wire up handlers
    (goal as any).on("status", (s: any) => {
      if (s && typeof s.text === "string") setStatus(s.text);
    });

    (goal as any).on("feedback", (fb: any) => {
      setFeedback(fb);
    });

    (goal as any).on("result", (res: any) => {
      setResult(res);
      setIsSending(false);
      setStatus("Goal finished");
    });

    setStatus("Sending goal…");
    setIsSending(true);
    setFeedback(null);
    setResult(null);

    goal.send();
  }

  const validLatLon = isFiniteNum(latitude) && isFiniteNum(longitude);
  const validXY = isFiniteNum(mapX) && isFiniteNum(mapY);

  const handleConvertGeodeticToMap = async () => {
    try {
      ensureROS();
      if (!validLatLon) {
        setStatus("Enter valid latitude and longitude");
        return;
      }
      setStatus("Converting with /fromLL…");
      const p = await callFromLL(parseFloat(latitude), parseFloat(longitude));
      setMapX(fmt(p.x, 3));
      setMapY(fmt(p.y, 3));
      setStatus("Converted to map frame (preview filled)");
    } catch (e: any) {
      setStatus(`Convert failed: ${e?.message ?? e}`);
    }
  };

  const handleSendGoal = async () => {
    try {
      ensureROS();

      if (mode === "geodetic") {
        if (!validLatLon) {
          setStatus("Enter valid latitude and longitude");
          return;
        }
        setStatus("Converting with /fromLL and sending to Nav2…");
        const p = await callFromLL(parseFloat(latitude), parseFloat(longitude));
        const yawRad = degToRad(parseFloat(yawDeg) || 0);
        sendNavigateGoal({ x: p.x, y: p.y, z: 0, yawRad });
      } else {
        if (!validXY) {
          setStatus("Enter valid map x and y");
          return;
        }
        const yawRad = degToRad(parseFloat(yawDeg) || 0);
        setStatus("Sending to Nav2…");
        sendNavigateGoal({ x: parseFloat(mapX), y: parseFloat(mapY), z: 0, yawRad });
      }
    } catch (e: any) {
      setIsSending(false);
      setStatus(`Error: ${e?.message ?? e}`);
    }
  };

  const handleCancel = () => {
    try {
      goalRef.current?.cancel();
      setStatus("Cancel requested");
    } catch (e: any) {
      setStatus(`Cancel failed: ${e?.message ?? e}`);
    }
  };

  return (
    <div className="goal-panel">
      <h3>Nav2: Navigate To Pose</h3>

      <div className="mode-switch">
        <button
          className={mode === "geodetic" ? "active" : ""}
          onClick={() => setMode("geodetic")}
        >
          Lat / Lon
        </button>
        <button
          className={mode === "map" ? "active" : ""}
          onClick={() => setMode("map")}
        >
          Map (x, y)
        </button>
      </div>

      {mode === "geodetic" ? (
        <div className="grid">
          <div className="input-group">
            <label>Latitude</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.000001"
              min={-90}
              max={90}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              onBlur={onBlurLat}
              placeholder="e.g. 45.421500"
            />
          </div>
          <div className="input-group">
            <label>Longitude</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              onBlur={onBlurLon}
              placeholder="e.g. -75.697200"
            />
          </div>
          <div className="input-group">
            <label>Yaw (deg)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={yawDeg}
              onChange={(e) => setYawDeg(e.target.value)}
              onBlur={onBlurYaw}
              placeholder="e.g. 0.0"
            />
          </div>
          <div className="row">
            <button onClick={handleConvertGeodeticToMap} disabled={!ros || isSending || !validLatLon}>
              Convert to Map (fill preview)
            </button>
          </div>
          <div className="preview two">
            <div className="input-group">
              <label>Preview X (map)</label>
              <input type="text" value={mapX} readOnly />
            </div>
            <div className="input-group">
              <label>Preview Y (map)</label>
              <input type="text" value={mapY} readOnly />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid">
          <div className="input-group">
            <label>X (map)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              value={mapX}
              onChange={(e) => setMapX(e.target.value)}
              onBlur={onBlurX}
              placeholder="e.g. 12.345"
            />
          </div>
          <div className="input-group">
            <label>Y (map)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              value={mapY}
              onChange={(e) => setMapY(e.target.value)}
              onBlur={onBlurY}
              placeholder="e.g. -6.789"
            />
          </div>
          <div className="input-group">
            <label>Yaw (deg)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={yawDeg}
              onChange={(e) => setYawDeg(e.target.value)}
              onBlur={onBlurYaw}
              placeholder="e.g. 0.0"
            />
          </div>
        </div>
      )}

      <div className="actions">
        <button onClick={handleSendGoal} disabled={!ros || isSending || (mode === "geodetic" ? !validLatLon : !validXY)}>
          {isSending ? "Sending…" : "Send Goal"}
        </button>
        <button onClick={handleCancel} disabled={!ros} className="secondary">
          Cancel Goal
        </button>
      </div>

      <div className="status">{status}</div>

      {feedback && (
        <div className="panel">
          <h4>Feedback</h4>
          <pre>{JSON.stringify(feedback, null, 2)}</pre>
        </div>
      )}

      {result && (
        <div className="panel">
          <h4>Result</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <style jsx>{`
        .goal-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        h3 { margin: 0; font-size: 1.25rem; text-align: center; border-bottom: 1px solid #444; padding-bottom: 0.5rem; }
        h4 { margin: 0 0 0.5rem 0; font-size: 1rem; }
        .mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .mode-switch button { background: #2b2b2b; padding: 0.5rem; border: 1px solid #333; border-radius: 6px; color: #fff; cursor: pointer; }
        .mode-switch button.active { background: #0070f3; border-color: #005fcc; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .row { grid-column: 1 / -1; }
        .preview.two { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .input-group { display: flex; flex-direction: column; }
        label { margin-bottom: 0.25rem; color: #ddd; }
        input { padding: 0.5rem; border: 1px solid #333; border-radius: 4px; background: #2b2b2b; color: #f1f1f1; }
        .actions { display: flex; gap: 0.5rem; }
        button { background: #0070f3; color: #f1f1f1; padding: 0.5rem 0.75rem; border: none; border-radius: 6px; cursor: pointer; }
        button.secondary { background: #444; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .status { min-height: 1.25rem; color: #a3c9ff; }
        .panel { background: #232323; border: 1px solid #333; border-radius: 6px; padding: 0.5rem; }
        pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
      `}</style>
    </div>
  );
};

export default GoalSetterPanel;
