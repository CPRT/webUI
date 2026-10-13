import { useEffect, useState } from 'react';
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

export function useGpsHeading(){
    const { ros } = useROS();
    const [heading, setHeading] = useState<number | null>(null);
    const [valid, setValid] = useState<boolean>(false);
    const [headingAccuracy, setHeadingAccuracy] = useState<number | null>(null);

    useEffect(() => {
        if (!ros) return;

        const headingTopic = new ROSLIB.Topic({
            ros,
            name: '/gps/heading',
            messageType: 'sensor_msgs/Imu',
            throttle_rate: 100,
        });

        const handleHeading = (msg: any) => {
            const yawVariance = msg.orientation_covariance?.[8];

            setHeadingAccuracy((2 * Math.sqrt(yawVariance) * 180) / Math.PI);

            if (yawVariance > 50) {
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

    return { heading, valid, headingAccuracy };
}
