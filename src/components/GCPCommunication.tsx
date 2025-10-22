import { invoke } from '@tauri-apps/api/core';
import React, { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface COMPortInfo {
  port: string;
  description: string;
  manufacturer: string | null;
  serial_number: string | null;
  vendor_id: number | null;
  product_id: number | null;
  port_type: string;
}

interface GCPStatusData {
  battery_level: number; // 0-100%
  system_state: number; // Current system state
  led_color: number; // LED color
  led_brightness: number; // LED brightness
  current_game_idx: number; // Current game index
  rtc_time: number[]; // [year, month, day, hour, min, sec, weekday, hundredths]
}

// Check if we're running in a Tauri context
const isTauriContext = () => {
  return (
    typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined
  );
};

const GCPCommunication: React.FC = () => {
  const [availablePorts, setAvailablePorts] = useState<COMPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusData, setStatusData] = useState<GCPStatusData | null>(null);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // Load available COM ports on component mount
  useEffect(() => {
    const loadPorts = async () => {
      try {
        const ports: COMPortInfo[] = await invoke('list_com_ports');
        setAvailablePorts(ports);
        setError(''); // Clear any previous errors
        if (ports.length > 0 && !selectedPort) {
          setSelectedPort(ports[0].port);
        }
      } catch (err) {
        setError(`Failed to load COM ports: ${err}`);
        console.error('Error loading ports:', err);
      }
    };

    loadPorts();
  }, [selectedPort]);

  const refreshPorts = async () => {
    try {
      const ports: COMPortInfo[] = await invoke('list_com_ports');
      setAvailablePorts(ports);
      setError(''); // Clear any previous errors
      if (ports.length === 0) {
        setSelectedPort('');
      }
    } catch (err) {
      setError(`Failed to refresh COM ports: ${err}`);
      console.error('Error refreshing ports:', err);
    }
  };

  const sendHello = async () => {
    if (!selectedPort) {
      setError('Please select a COM port first');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatusData(null);

    try {
      const response: GCPStatusData = await invoke('gcp_send_hello', {
        portName: selectedPort,
      });

      setStatusData(response);
      setIsConnected(true);
      console.log('HELLO Response:', response);
    } catch (err) {
      setError(`HELLO command failed: ${err}`);
      setIsConnected(false);
      console.error('Error sending HELLO:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = async () => {
    if (!selectedPort) {
      setError('Please select a COM port first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response: GCPStatusData = await invoke('gcp_get_status', {
        portName: selectedPort,
      });

      setStatusData(response);
      setIsConnected(true);
      console.log('Status Response:', response);
    } catch (err) {
      setError(`Get status failed: ${err}`);
      setIsConnected(false);
      console.error('Error getting status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: number[]) => {
    if (time.length < 6) return 'Invalid time';
    const [year, month, day, hour, min, sec] = time;
    return `20${year.toString().padStart(2, '0')}-${month
      .toString()
      .padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour
      .toString()
      .padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec
      .toString()
      .padStart(2, '0')}`;
  };

  const formatLedColor = (color: number) => {
    return `#${color.toString(16).padStart(4, '0')}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GCP Communication Test</CardTitle>
          <CardDescription>
            Test communication with Glitchi devices using the GCP v2.0 protocol
            over UART
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* COM Port Selection */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                COM Port:
              </label>
              <Select value={selectedPort} onValueChange={setSelectedPort}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a COM port" />
                </SelectTrigger>
                <SelectContent>
                  {availablePorts.map(port => (
                    <SelectItem key={port.port} value={port.port}>
                      {port.port} - {port.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={refreshPorts} variant="outline" className="mt-7">
              Refresh
            </Button>
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={sendHello}
              disabled={isLoading || !selectedPort}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Sending...' : 'HELLO'}
            </Button>
            <Button
              onClick={getStatus}
              disabled={isLoading || !selectedPort}
              variant="outline"
            >
              Get Status
            </Button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            {selectedPort && <Badge variant="outline">{selectedPort}</Badge>}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            </div>
          )}

          {/* Status Data Display */}
          {statusData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Device Status Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Battery Level:</strong> {statusData.battery_level}%
                  </div>
                  <div>
                    <strong>System State:</strong> {statusData.system_state}
                  </div>
                  <div>
                    <strong>LED Color:</strong>{' '}
                    {formatLedColor(statusData.led_color)}
                    <div
                      className="inline-block w-4 h-4 ml-2 border border-gray-300 rounded"
                      style={{
                        backgroundColor: formatLedColor(statusData.led_color),
                      }}
                    ></div>
                  </div>
                  <div>
                    <strong>LED Brightness:</strong> {statusData.led_brightness}
                  </div>
                  <div>
                    <strong>Current Game Index:</strong>{' '}
                    {statusData.current_game_idx}
                  </div>
                  <div>
                    <strong>RTC Time:</strong> {formatTime(statusData.rtc_time)}
                  </div>
                </div>

                {/* Raw Data Display */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-sm">
                    Raw Data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(statusData, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}

          {/* Protocol Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Protocol Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <strong>Protocol:</strong> GCP v2.0 (Glitchi Communication
                Protocol)
              </div>
              <div>
                <strong>Transport:</strong> UART at 115200 bps, 8N1, RTS/CTS
              </div>
              <div>
                <strong>Frame Format:</strong> Preamble(2) + Length(2) +
                MsgType(2) + Parameters + Data + CRC16(2)
              </div>
              <div>
                <strong>HELLO Command:</strong> Establishes connection and
                returns device status
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default GCPCommunication;
