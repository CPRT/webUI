'use client';

import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
import { useROS } from '@/ros/ROSContext';

enum CANState {
  ERROR_ACTIVE,
  ERROR_WARNING,
  ERROR_PASSIVE,
  BUS_OFF,
  STOPPED,
  SLEEPING
}

type CANStatus = {
  up: boolean;
  state: CANState;
  txerr: number;
  rxerr: number;
  tx_packets: number;
  tx_packet_errs: number;
  tx_packet_drops: number;
  rx_packets: number;
  rx_packet_errs: number;
  rx_packet_drops: number;
  restarts: number;
  bus_error: number;
  arbitration_lost: number;
  error_warning: number;
  error_passive: number;
  bus_off: number;
};

type USBDevice = {
  bus: number;
  dev: number;
  vendor: number;
  product: number;
  name: string;
};

type USBList = {
  devices: USBDevice[];
};

const InterfaceManagerPanel: React.FC = () => {
  const { ros } = useROS();
  const [can0, setCan0] = useState<CANStatus | null>(null);
  const [can1, setCan1] = useState<CANStatus | null>(null);
  const [usbList, setUsbList] = useState<USBList | null>(null);

  useEffect(() => {
    if (!ros) return;

    const can0 = new ROSLIB.Topic({
      ros,
      name: '/can0_status',
      messageType: 'interfaces/msg/CANStatus',
    });
    
    const can1 = new ROSLIB.Topic({
      ros,
      name: '/can1_status',
      messageType: 'interfaces/msg/CANStatus',
    });

    const usbList = new ROSLIB.Topic({
      ros,
      name: '/usb_list',
      messageType: 'interfaces/msg/USBList',
    });
    
    const handleCan0 = (msg: any) => {
      setCan0(msg);
    }

    const handleCan1 = (msg: any) => {
      setCan1(msg);
    }

    const handleUsbList = (msg: any) => {
      setUsbList(msg);
    }

    can0.subscribe(handleCan0);
    can1.subscribe(handleCan1);
    usbList.subscribe(handleUsbList);

    return () => {
      can0.unsubscribe(handleCan0);
      can1.unsubscribe(handleCan1);
      usbList.unsubscribe(handleUsbList);
    };
  }, [ros]);

  const stateStyle = (can: CANStatus | null) => {
    let background = '#6c757d';
    let color = '#f1f1f1';
    if (can && !can.up) {
      background = '#ef4444';
    }else if (can) {
      switch (can.state) {
        case CANState.ERROR_ACTIVE:
          background = '#22c55e';
          color = '#0a0a0a';
          break;
        
        case CANState.ERROR_WARNING:
        case CANState.ERROR_PASSIVE:
          background = '#ffc107';
          color = '#0a0a0a';
          break;

        case CANState.BUS_OFF:
          background = '#ef4444';
          break;

        default:
          break;
      }
    }
    return {
      background: background,
      color: color,
      borderRadius: '4px',
      textAlign: 'center' as const,
      margin: '4px',
      display: 'block',
    };
  };

  return (
    <div className="interface-manager-panel">
      <table>
        <thead>
          <tr>
            <th>CAN</th>
            <th style={{ width: '180px' }}>CAN0</th>
            <th style={{ width: '180px' }}>CAN1</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Up?</td>
            <td>
              <span
                className="status-led"
                style={{ backgroundColor: can0?.up ? '#22c55e' : '#ef4444' }}
              />
            </td>
            <td>
              <span
                className="status-led"
                style={{ backgroundColor: can1?.up ? '#22c55e' : '#ef4444' }}
              />
            </td>
          </tr>
          <tr>
            <td>State</td>
            <td><span style={stateStyle(can0)}>{ can0 ? CANState[can0.state] : '-'}</span></td>
            <td><span style={stateStyle(can1)}>{ can1 ? CANState[can1.state] : '-'}</span></td>
          </tr>
          <tr>
            <td>Bit errors (TX/RX)</td>
            <td>{ can0 ? `${can0.txerr} / ${can0.rxerr}` : '-'}</td>
            <td>{ can1 ? `${can1.txerr} / ${can1.rxerr}` : '-'}</td>
          </tr>
          <tr>
            <td>Packets (TX/RX)</td>
            <td>{ can0 ? `${can0.tx_packets} / ${can0.rx_packets}` : '-'}</td>
            <td>{ can1 ? `${can1.tx_packets} / ${can1.rx_packets}` : '-'}</td>
          </tr>
          <tr>
            <td>Packet Errors (TX/RX)</td>
            <td>{ can0 ? `${can0.tx_packet_errs} / ${can0.rx_packet_errs}` : '-'}</td>
            <td>{ can1 ? `${can1.tx_packet_errs} / ${can1.rx_packet_errs}` : '-'}</td>
          </tr>
          <tr>
            <td>Packet Drops (TX/RX)</td>
            <td>{ can0 ? `${can0.tx_packet_drops} / ${can0.rx_packet_drops}` : '-'}</td>
            <td>{ can1 ? `${can1.tx_packet_drops} / ${can1.rx_packet_drops}` : '-'}</td>
          </tr>
          <tr>
            <td>Restarts / Bus Err / Arb. Lost</td>
            <td>{ can0 ? `${can0.restarts} / ${can0.bus_error} / ${can0.arbitration_lost}` : '-'}</td>
            <td>{ can1 ? `${can1.restarts} / ${can1.bus_error} / ${can1.arbitration_lost}` : '-'}</td>
          </tr>
          <tr>
            <td>Error Warning / Error Passive / Bus Off</td>
            <td>{ can0 ? `${can0.error_warning} / ${can0.error_passive} / ${can0.bus_off}` : '-'}</td>
            <td>{ can1 ? `${can1.error_warning} / ${can1.error_passive} / ${can1.bus_off}` : '-'}</td>
          </tr>
        </tbody>
      </table>
      <h3 style={{ paddingTop: '10px' }}>USB Devices</h3>
      <table>
        <thead>
          <tr>
            <td>Bus #</td>
            <td>Device #</td>
            <td>ID</td>
            <td>Name</td>
          </tr>
        </thead>
        <tbody>
          {usbList ? usbList.devices.map((dev) => (
            <tr>
              <td>{ dev.bus }</td>
              <td>{ dev.dev }</td>
              <td>{ `${dev.vendor.toString(16).padStart(4, "0")}:${dev.product.toString(16).padStart(4, "0")}` }</td>
              <td>{ dev.name }</td>
            </tr>
          )) : (
          <tr><td>-</td></tr>
          )}
        </tbody>
      </table>
      <style jsx>{`
      .interface-manager-panel {
          background: #1e1e1e;
          color: #f1f1f1;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        table thead {
          background: #2d2d2d;
          border-bottom: 2px solid #444;
        }

        table th {
          text-align: left;
          font-weight: 600;

        }

        table td {
          border-bottom: 1px solid #333;
          padding: 0px 3px;
        }

        table tbody tr:hover {
          background-color: #262626;
        }

        .status-led {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }
     `}</style>
    </div>
  )
};

export default InterfaceManagerPanel;
