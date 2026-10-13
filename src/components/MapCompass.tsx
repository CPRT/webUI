import React from "react";
import { useGpsHeading } from '@/hooks/useGpsHeading';

const MapCompass: React.FC = () => {
    const { heading, valid, headingAccuracy } = useGpsHeading();
    const RIM_RADIUS = 95;

    // Arc along the rim indicating the accuracy of the heading
    const arcPath = (halfAngleDeg: number, r: number): string => {
        const a = (halfAngleDeg * Math.PI) / 180;
        const x1 = 100 - r * Math.sin(a);
        const x2 = 100 + r * Math.sin(a);
        const y = 100 - r * Math.cos(a);
        const largeArc = halfAngleDeg > 90 ? 1 : 0;
        return `M ${x1} ${y} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y}`;
    };

    return (
        <div>
            <svg width="125" height="125" viewBox="0 0 200 200">
                {/* <!-- Outer Circle --> */}
                <circle cx="100" cy="100" r={RIM_RADIUS} fill="white" fillOpacity="0.5" stroke="black" strokeWidth="2" />
                {heading !== null && headingAccuracy !== null && headingAccuracy >= 180 && (
                    <path
                        d={arcPath(Math.max(headingAccuracy, 2), RIM_RADIUS)}
                        fill="none"
                        stroke={valid ? "red" : "grey"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        transform={`rotate(${heading} 100 100)`}
                    />
                )}
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

