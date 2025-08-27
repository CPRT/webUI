import React, {useEffect, useState} from "react";
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

type Quaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
};

//extract yaw, convert to degrees, normalize
const headingFromQuaternion = (q: Quaternion): number => {
    const { x, y, z, w } = q;
    const yaw = Math.atan2(
        2.0 * (w * z + x * y),
        1.0 - 2.0 * (y * y + z * z)
    );
    const heading = (yaw * 180) / Math.PI;
    return (heading + 360) % 360;
};

const MapCompass: React.FC = () => {
    const { ros, connectionStatus: rosStatus } = useROS();
    const [heading, setHeading] = useState<number | null>(null);
    const [valid, setValid] = useState<boolean>(false);

    useEffect(() => {
        if (!ros) return;

        const headingTopic = new ROSLIB.Topic({
            ros,
            name: '/gps/heading',
            messageType: 'sensor_msgs/Imu',
            throttle_rate: 100,
        });

        const handleHeading = (msg: any) => {
            if (msg.orientation_covariance[8] > 50) {
                setValid(false);
                return;
            }
            const heading = headingFromQuaternion(msg.orientation);
            setValid(true);
            setHeading(heading);
        };

        headingTopic.subscribe(handleHeading);
        return () => headingTopic.unsubscribe(handleHeading);
    }, [ros]);

    return(
        <div> 
            <svg width="125" height="125" viewBox="0 0 200 200">
                {/* <!-- Outer Circle --> */}
                <circle cx="100" cy="100" r="95" fill="white" fillOpacity="0.5" stroke="black" strokeWidth="2" />
                {/* <!-- Compass Needle --> */}
                <polygon
                    id="compass-needle"
                    points="100,20 90,100 95,100 95,160 105,160 105,100 110,100"
                    fill={valid ? "red" : "grey"}
                    stroke="black"
                    strokeWidth="1"
                    transform={`rotate(${heading} 100 100)`}
                />
                {/* <!-- Cardinal Directions --> */}
                <text x="100" y="25" textAnchor="middle" fontSize="16" fontFamily="sans-serif">N</text>
                <text x="100" y="190" textAnchor="middle" fontSize="16" fontFamily="sans-serif">S</text>
                <text x="180" y="105" textAnchor="middle" fontSize="16" fontFamily="sans-serif">E</text>
                <text x="20" y="105" textAnchor="middle" fontSize="16" fontFamily="sans-serif">W</text>
                {/* Minor Ticks */}
                {Array.from({ length: 36 }).map((_, i) => {
                    const angle = (i * 10) * (Math.PI / 180);
                    const x1 = 100 + Math.cos(angle) * 90;
                    const y1 = 100 + Math.sin(angle) * 90;
                    const x2 = 100 + Math.cos(angle) * 85;
                    const y2 = 100 + Math.sin(angle) * 85;
                    return (
                    <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="black"
                        strokeWidth="1"
                    />
                    );
                })}
                </svg>
        </div>
    );
}
export default MapCompass;

