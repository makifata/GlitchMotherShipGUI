import { useConnection } from '@/contexts/ConnectionContext';
import { useConnectionActions } from '@/hooks/useConnectionActions';
import {
  formatBoardType,
  formatChipModel,
  formatFeatures,
  formatLedColor,
  formatManufactureDate,
  formatTime,
} from '@/lib/formatters';
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

interface GCPStatusData {
  battery_level: number; // 0-100%
  system_state: number; // Current system state
  led_color: number; // LED color
  led_brightness: number; // LED brightness
  current_game_idx: number; // Current game index
  rtc_time: number[]; // [year, month, day, hour, min, sec, weekday, hundredths]
}

interface GCPFwVersionData {
  fw_version_major: number; // FW_VERSION_MAJOR
  fw_version_minor: number; // FW_VERSION_MINOR
  fw_version_patch: number; // FW_VERSION_PATCH
  fw_version_suffix: number[]; // FW_VERSION_SUFFIX (3 chars)
}

interface GCPHardwareData {
  manufacture_date: number; // Manufacturing date (e.g., 0x0719 = January 25, 2025)
  serial_number: number; // Serial number (0-65535)
  board_type: number; // Board type (DEV=0x01, REV0=0x10...)
  hw_revision: number; // Hardware revision (0, 1, 2...)
  chip_model: number; // Chip model (Apollo4Lite=0x40...)
  features: number; // Feature flags (bit0:USB, bit1:BLE...)
}

const GCPCommunication: React.FC = () => {
  const { isConnected, connectedPort } = useConnection();
  const { invokeGCPCommand } = useConnectionActions();

  const [isLoading, setIsLoading] = useState(false);
  const [statusData, setStatusData] = useState<GCPStatusData | null>(null);
  const [fwVersionData, setFwVersionData] = useState<GCPFwVersionData | null>(
    null
  );
  const [hardwareData, setHardwareData] = useState<GCPHardwareData | null>(
    null
  );
  const [error, setError] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [fwUpdateStatus, setFwUpdateStatus] = useState<string>('');
  const [robustnessTestStatus, setRobustnessTestStatus] = useState<string>('');

  // Status polling functions
  const startStatusPolling = () => {
    if (pollingInterval || !isConnected) return;

    setIsPolling(true);
    const interval = window.setInterval(async () => {
      try {
        const response: GCPStatusData = await invokeGCPCommand(
          'gcp_get_status'
        );
        setStatusData(response);
        setError('');
      } catch (err) {
        console.error('Status polling error:', err);
        setError(`Status polling failed: ${err}`);
        // Don't stop polling on single errors - device might be busy
      }
    }, 1000); // 1Hz = 1000ms interval

    setPollingInterval(interval);
  };

  const stopStatusPolling = () => {
    if (pollingInterval) {
      window.clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsPolling(false);
  };

  // Cleanup polling on component unmount or port change
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Stop polling when connection is lost
  useEffect(() => {
    if (!isConnected && isPolling) {
      stopStatusPolling();
      setStatusData(null);
      setFwVersionData(null);
      setHardwareData(null);
    }
  }, [isConnected, isPolling]);

  const sendHello = async () => {
    if (!isConnected) {
      setError('Please connect to a COM port first');
      return;
    }

    setIsLoading(true);
    setError('');
    setHardwareData(null);

    try {
      const response = await invokeGCPCommand('gcp_send_hello');
      console.log('HELLO Response (raw):', response);

      // Check if response has hardware data fields or status data fields
      if (response && typeof response === 'object') {
        if ('manufacture_date' in response && 'serial_number' in response) {
          // This is the new hardware data format (GCP v2.2)
          setHardwareData(response as GCPHardwareData);
          console.log('HELLO Response parsed as Hardware Data:', response);
        } else if ('battery_level' in response && 'system_state' in response) {
          // This is the old status data format (fallback compatibility)
          setStatusData(response as GCPStatusData);
          setError(
            'Note: Device returned status data instead of hardware data. This may indicate the device firmware is still using GCP v2.1 or earlier.'
          );
          console.log(
            'HELLO Response parsed as Status Data (legacy compatibility):',
            response
          );
        } else {
          setError(
            'HELLO response format is unrecognized. Check console for raw response.'
          );
          console.error('Unrecognized HELLO response format:', response);
        }
      } else {
        setError('HELLO response is empty or invalid');
        console.error('Invalid HELLO response:', response);
      }
    } catch (err) {
      setError(`HELLO command failed: ${err}`);
      console.error('Error sending HELLO:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = async () => {
    if (!isConnected) {
      setError('Please connect to a COM port first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response: GCPStatusData = await invokeGCPCommand('gcp_get_status');
      setStatusData(response);
      console.log('Status Response:', response);
    } catch (err) {
      setError(`Get status failed: ${err}`);
      console.error('Error getting status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFwVersion = async () => {
    if (!isConnected) {
      setError('Please connect to a COM port first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response: GCPFwVersionData = await invokeGCPCommand(
        'gcp_get_fw_version'
      );
      setFwVersionData(response);
      console.log('Firmware Version Response:', response);
    } catch (err) {
      setError(`Get firmware version failed: ${err}`);
      console.error('Error getting firmware version:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startFirmwareUpdate = async () => {
    if (!isConnected) {
      setError('Please connect to a COM port first');
      return;
    }

    setIsLoading(true);
    setError('');
    setFwUpdateStatus('');

    try {
      // Import invoke directly
      const { invoke } = await import('@tauri-apps/api/core');

      // Create a test firmware payload (12 bytes for testing)
      const testFirmware = new Uint8Array(12);
      testFirmware.set([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x47, 0x43, 0x50, 0x21, 0x0a, 0x00,
      ]);

      setFwUpdateStatus('Starting firmware update...');
      console.log(
        'Starting firmware update with test payload:',
        Array.from(testFirmware)
      );

      // Call Tauri command directly like working commands do
      const response = await invoke<string>('gcp_start_firmware_update', {
        portName: connectedPort,
        firmwareData: Array.from(testFirmware),
        chunkSize: 2036,
      });

      setFwUpdateStatus('Firmware update start acknowledged!');
      console.log('Firmware Update Start Response:', response);
    } catch (err) {
      setError(`Firmware update start failed: ${err}`);
      setFwUpdateStatus('Firmware update start failed');
      console.error('Error starting firmware update:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const runRobustnessTest = async () => {
    if (!isConnected) {
      setError('Please connect to a COM port first');
      return;
    }

    setIsLoading(true);
    setError('');
    setRobustnessTestStatus('');

    let randomSize = 0;

    try {
      // Import invoke directly
      const { invoke } = await import('@tauri-apps/api/core');

      // Generate random payload size between 0-1024 bytes
      randomSize = Math.floor(Math.random() * 1025); // 0-1024
      const randomPayload = new Uint8Array(randomSize);

      // Fill with random data
      for (let i = 0; i < randomSize; i++) {
        randomPayload[i] = Math.floor(Math.random() * 256);
      }

      setRobustnessTestStatus(`Testing ${randomSize}-byte packet...`);
      console.log(
        `Robustness test: sending ${randomSize} bytes of random data`
      );
      console.log(
        'Random payload preview (first 16 bytes):',
        Array.from(randomPayload.slice(0, 16))
      );

      // Call Tauri command directly like working commands do
      const response = await invoke<string>('gcp_send_firmware_chunk', {
        portName: connectedPort,
        chunkData: Array.from(randomPayload),
        sequenceNumber: randomSize,
      });

      setRobustnessTestStatus(
        `✅ SUCCESS: ${randomSize}-byte packet transmitted and acknowledged!`
      );
      console.log('Robustness Test Response:', response);
    } catch (err) {
      setRobustnessTestStatus(`❌ FAILED: ${randomSize}-byte packet failed`);
      setError(`Robustness test failed: ${err}`);
      console.error('Error in robustness test:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GCP Communication Test</CardTitle>
          <CardDescription>
            Test communication with Glitchi devices using the GCP v2.2 protocol
            over UART. Connected to: {connectedPort || 'Not Connected'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm font-medium">Connection Status:</span>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            {connectedPort && <Badge variant="outline">{connectedPort}</Badge>}
          </div>

          {/* Command Buttons */}
          <div className="space-y-3">
            <div className="flex space-x-4 flex-wrap gap-2">
              <Button
                onClick={sendHello}
                disabled={isLoading || !isConnected}
                variant="outline"
              >
                {isLoading ? 'Sending...' : 'HELLO'}
              </Button>
              <Button
                onClick={getStatus}
                disabled={isLoading || !isConnected}
                variant="outline"
              >
                Get Status
              </Button>
              <Button
                onClick={getFwVersion}
                disabled={isLoading || !isConnected}
                variant="outline"
              >
                Get Firmware Version
              </Button>
              <Button
                onClick={startFirmwareUpdate}
                disabled={isLoading || !isConnected}
                variant="outline"
              >
                {isLoading ? 'Updating...' : 'Test FW Update Start'}
              </Button>
              <Button
                onClick={runRobustnessTest}
                disabled={isLoading || !isConnected}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Random Packet Test (0-1024B)'}
              </Button>
            </div>

            {/* Status Polling Control */}
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button
                  onClick={startStatusPolling}
                  disabled={!isConnected || isPolling}
                  variant="default"
                  size="sm"
                >
                  Start Polling (1Hz)
                </Button>
                <Button
                  onClick={stopStatusPolling}
                  disabled={!isPolling}
                  variant="outline"
                  size="sm"
                >
                  Stop Polling
                </Button>
              </div>
              {isPolling && (
                <Badge variant="default" className="bg-yellow-500">
                  Polling Active
                </Badge>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            </div>
          )}

          {/* Firmware Update Status Display */}
          {fwUpdateStatus && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="text-sm text-blue-800 font-medium">
                  Firmware Update:
                </div>
                <div className="text-sm text-blue-600">{fwUpdateStatus}</div>
              </div>
            </div>
          )}

          {/* Robustness Test Status Display */}
          {robustnessTestStatus && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="text-sm text-purple-800 font-medium">
                  Robustness Test:
                </div>
                <div className="text-sm text-purple-600">
                  {robustnessTestStatus}
                </div>
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

          {/* Hardware Data Display (HELLO Response) */}
          {hardwareData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Hardware Information Response (HELLO)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Manufacture Date:</strong>{' '}
                    {formatManufactureDate(
                      hardwareData.manufacture_date,
                      'hex'
                    )}
                  </div>
                  <div>
                    <strong>Serial Number:</strong> {hardwareData.serial_number}
                  </div>
                  <div>
                    <strong>Board Type:</strong>{' '}
                    {formatBoardType(hardwareData.board_type)}
                  </div>
                  <div>
                    <strong>Hardware Revision:</strong>{' '}
                    {hardwareData.hw_revision}
                  </div>
                  <div>
                    <strong>Chip Model:</strong>{' '}
                    {formatChipModel(hardwareData.chip_model)}
                  </div>
                  <div>
                    <strong>Features:</strong>{' '}
                    {formatFeatures(hardwareData.features)}
                  </div>
                </div>

                {/* Raw Data Display */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-sm">
                    Raw Hardware Data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(hardwareData, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}

          {/* Firmware Version Display */}
          {fwVersionData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Firmware Version Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Major Version:</strong>{' '}
                    {fwVersionData.fw_version_major}
                  </div>
                  <div>
                    <strong>Minor Version:</strong>{' '}
                    {fwVersionData.fw_version_minor}
                  </div>
                  <div>
                    <strong>Patch Version:</strong>{' '}
                    {fwVersionData.fw_version_patch}
                  </div>
                  <div>
                    <strong>Version Suffix:</strong>{' '}
                    {String.fromCharCode(
                      ...fwVersionData.fw_version_suffix.filter(c => c !== 0)
                    )}
                  </div>
                  <div className="col-span-2">
                    <strong>Full Version:</strong>{' '}
                    <Badge variant="outline">
                      v{fwVersionData.fw_version_major}.
                      {fwVersionData.fw_version_minor}.
                      {fwVersionData.fw_version_patch}
                      {String.fromCharCode(
                        ...fwVersionData.fw_version_suffix.filter(c => c !== 0)
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Raw Data Display */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-sm">
                    Raw Version Data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(fwVersionData, null, 2)}
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
                <strong>Protocol:</strong> GCP v2.2 (Glitchi Communication
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
                returns 8 bytes of hardware identification data
              </div>
              <div>
                <strong>Hardware Fields:</strong> Manufacturing date, serial
                number, board type, HW revision, chip model, feature flags
              </div>
              <div>
                <strong>FW_UPDATE_START:</strong> Initiates firmware update with
                12-byte test payload, sends frame parameters including size,
                CRC32, and chunk size
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default GCPCommunication;
