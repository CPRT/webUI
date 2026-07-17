import React from 'react';

interface Props {
  color?: string;
  outlineColor?: string;
  className?: string;
}

const BusVoltageIndicator : React.FC<Props> = ({
  color = '#ffffff',
  outlineColor = '#ffffff',
  className,
}) => (
  <svg
    className={className}
    width="22"
    height="28"
    viewBox="0 0 43 47"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
    fill={color} 
    d="M24.5644 5C24.9281 5 25.1701 5.37585 25.0196 5.7069L20.3409 16H24.9895C25.4257 16 25.6528 16.5196 25.3564 16.8397L13.9825 29.123L16.3976 20H6.85594C6.51466 20 6.27368 19.6657 6.3816 19.3419L11.0483 5.34189C11.1163 5.13771 11.3074 5 11.5226 5H24.5644Z" 
    />
    <path 
    d="M29.8447 1C30.6447 1.00002 31.1768 1.82736 30.8457 2.55566L26.5527 12H32.7715C33.731 12.0003 34.2301 13.1435 33.5781 13.8477L8.7334 40.6797L6.00586 43.626L7.0332 39.7441L11.2012 24H2.13867C1.3879 24 0.857303 23.264 1.09473 22.5518L7.9834 1.88867L8.01953 1.79102C8.22197 1.31455 8.69149 1.00016 9.21582 1H29.8447Z" 
    stroke={outlineColor}
    strokeWidth="2" 
    strokeMiterlimit="11.4737"
    fill="none"
    />
  </svg>
);

export default BusVoltageIndicator;