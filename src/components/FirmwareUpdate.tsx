import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useConnection } from '@/contexts/ConnectionContext';
import { useConnectionActions } from '@/hooks/useConnectionActions';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import React, { useEffect, useRef, useState } from 'react';

interface FirmwareFile {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileSizeFormatted: string;
  crc32: string;
  estimatedChunks: number;
  chunkSize: number;
  estimatedTimeSeconds: number;
  estimatedTimeFormatted: string;
  isValid: boolean;
  fileType: string;
}

interface FirmwareUpdateProgress {
  stage: string;
  current_chunk: number;
  total_chunks: number;
  bytes_sent: number;
  total_bytes: number;
  percentage: number;
  status: string;
}

interface FirmwareUpdateResult {
  success: boolean;
  message: string;
  crc32_match: boolean;
  total_chunks: number;
  total_bytes: number;
}

interface FirmwareUpdateProps {
  className?: string;
}

const FirmwareUpdate: React.FC<FirmwareUpdateProps> = ({ className = '' }) => {
  const { isConnected, connectedPort } = useConnection();
  const { invokeGCPCommand } = useConnectionActions();

  const [selectedFile, setSelectedFile] = useState<string>('');
  const [firmwareFile, setFirmwareFile] = useState<FirmwareFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] =
    useState<FirmwareUpdateProgress | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const debugTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll debug logs to bottom
  useEffect(() => {
    if (debugTextAreaRef.current) {
      debugTextAreaRef.current.scrollTop =
        debugTextAreaRef.current.scrollHeight;
    }
  }, [debugLogs]);

  // Listen for firmware update progress events
  useEffect(() => {
    const unlisten = listen('firmware-progress', event => {
      const progress = event.payload as FirmwareUpdateProgress;
      setUpdateProgress(progress);
      addDebugLog(`${progress.stage}: ${progress.status}`);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
  };

  const loadFirmwareFile = async () => {
    setIsLoading(true);
    setError('');
    addDebugLog('Opening file dialog...');

    try {
      const selected = await open({
        title: 'Select a firmware file',
        multiple: false,
        filters: [
          {
            name: 'Firmware Files',
            extensions: ['bin', 'hex', 'fw'],
          },
        ],
      });

      if (selected && typeof selected === 'string') {
        setSelectedFile(selected);
        addDebugLog(`File selected: ${selected}`);
        await analyzeFirmwareFile(selected);
      } else {
        setError('No file selected');
        addDebugLog('No file selected by user');
      }
    } catch (error) {
      const errorMsg = `Failed to open file dialog: ${error}`;
      console.error('Error selecting file:', error);
      setError(errorMsg);
      addDebugLog(`ERROR: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeFirmwareFile = async (filePath: string) => {
    addDebugLog('Analyzing firmware file...');

    try {
      // Use the new get_firmware_file_info command for better analysis
      const analysis = await invoke<FirmwareFile>('get_firmware_file_info', {
        filePath,
      });
      setFirmwareFile(analysis);
      addDebugLog(
        `File analysis complete: ${analysis.fileName} (${analysis.fileSizeFormatted})`
      );
      addDebugLog(`CRC32: ${analysis.crc32}`);
      addDebugLog(`Estimated chunks: ${analysis.estimatedChunks}`);
      addDebugLog(
        `Estimated transfer time: ${analysis.estimatedTimeFormatted}`
      );
    } catch (error) {
      const errorMsg = `Failed to analyze firmware file: ${error}`;
      console.error('Error analyzing file:', error);
      setError(errorMsg);
      addDebugLog(`ERROR: ${errorMsg}`);
      setFirmwareFile(null);
    }
  };

  const startFirmwareUpdate = async () => {
    if (!isConnected || !connectedPort) {
      const errorMsg = 'No device connected. Please connect to a device first.';
      setError(errorMsg);
      addDebugLog(`ERROR: ${errorMsg}`);
      return;
    }

    if (!firmwareFile || !selectedFile) {
      const errorMsg =
        'No firmware file loaded. Please load a firmware file first.';
      setError(errorMsg);
      addDebugLog(`ERROR: ${errorMsg}`);
      return;
    }

    setIsUpdating(true);
    setError('');
    setUpdateProgress(null);
    addDebugLog('=== STARTING FIRMWARE UPDATE PROCESS ===');
    addDebugLog(`Connected port: ${connectedPort}`);
    addDebugLog(`Firmware file: ${firmwareFile.fileName}`);
    addDebugLog(`File size: ${firmwareFile.fileSize} bytes`);
    addDebugLog(`CRC32: ${firmwareFile.crc32}`);

    try {
      // Step 1: Send HELLO command to verify connection
      addDebugLog('Step 1: Verifying device connection...');
      const helloResponse = await invokeGCPCommand('gcp_send_hello');
      addDebugLog(
        `Device responded to HELLO: ${JSON.stringify(helloResponse)}`
      );

      // Step 2: Start the actual firmware update using Rust backend
      addDebugLog('Step 2: Starting firmware update...');
      const window = getCurrentWindow();

      const result = await invoke<FirmwareUpdateResult>('gcp_firmware_update', {
        portName: connectedPort,
        filePath: selectedFile,
        window,
      });

      if (result.success) {
        addDebugLog(`SUCCESS: ${result.message}`);
        addDebugLog(`Chunks sent: ${result.total_chunks}`);
        addDebugLog(`Total bytes: ${result.total_bytes}`);
        addDebugLog(
          `CRC32 verification: ${result.crc32_match ? 'PASSED' : 'FAILED'}`
        );

        if (result.crc32_match) {
          addDebugLog('Firmware update completed successfully!');
          // Optionally ask user if they want to reset the device
          addDebugLog(
            'You can now reset the device to apply the new firmware.'
          );
        } else {
          setError('Firmware verification failed - CRC32 mismatch');
        }
      } else {
        setError(result.message);
        addDebugLog(`FAILED: ${result.message}`);
      }
    } catch (error) {
      const errorMsg = `Firmware update failed: ${error}`;
      console.error('Firmware update error:', error);
      setError(errorMsg);
      addDebugLog(`ERROR: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
      addDebugLog('=== FIRMWARE UPDATE PROCESS COMPLETED ===');
    }
  };

  const abortFirmwareUpdate = async () => {
    if (!connectedPort) {
      return;
    }

    try {
      addDebugLog('Aborting firmware update...');
      const result = await invoke<string>('gcp_abort_firmware_update', {
        portName: connectedPort,
      });
      addDebugLog(`Abort result: ${result}`);
    } catch (error) {
      addDebugLog(`Failed to abort firmware update: ${error}`);
    }
  };

  const resetDevice = async (applyFirmware: boolean = false) => {
    if (!connectedPort) {
      return;
    }

    try {
      addDebugLog(`Resetting device (apply firmware: ${applyFirmware})...`);
      const result = await invoke<string>('gcp_reset_device', {
        portName: connectedPort,
        applyFirmware,
      });
      addDebugLog(`Reset result: ${result}`);
    } catch (error) {
      addDebugLog(`Failed to reset device: ${error}`);
    }
  };

  const clearAll = () => {
    setSelectedFile('');
    setFirmwareFile(null);
    setUpdateProgress(null);
    setError('');
    clearDebugLogs();
    addDebugLog('Session cleared - ready for new firmware update');
  };

  return (
    <div className={`firmware-update ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>🔄 Firmware Update</CardTitle>
          <CardDescription>
            Load firmware file and update device through GCP protocol. Device:{' '}
            {connectedPort || 'Not Connected'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Loading Section */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={loadFirmwareFile}
              disabled={isLoading || isUpdating}
              variant="secondary"
            >
              {isLoading ? 'Loading...' : 'Load File'}
            </Button>

            <Button
              onClick={startFirmwareUpdate}
              disabled={
                !isConnected || !firmwareFile || isLoading || isUpdating
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? 'Updating...' : 'Start Update'}
            </Button>

            {isUpdating && (
              <Button
                onClick={abortFirmwareUpdate}
                variant="destructive"
                size="sm"
              >
                Abort
              </Button>
            )}

            {firmwareFile && !isUpdating && (
              <>
                <Button
                  onClick={() => resetDevice(false)}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Soft Reset
                </Button>
                <Button
                  onClick={() => resetDevice(true)}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                >
                  Apply & Reset
                </Button>
              </>
            )}

            <Button
              onClick={clearAll}
              disabled={isLoading || isUpdating}
              variant="outline"
            >
              Clear All
            </Button>

            <Button
              onClick={clearDebugLogs}
              disabled={isLoading || isUpdating}
              variant="outline"
              size="sm"
            >
              Clear Logs
            </Button>

            <Button
              onClick={async () => {
                try {
                  const result = await invoke<string>(
                    'test_gcp_frame_construction'
                  );
                  addDebugLog('=== FRAME CONSTRUCTION TEST ===');
                  result.split('\n').forEach(line => addDebugLog(line));
                } catch (error) {
                  addDebugLog(`Test error: ${error}`);
                }
              }}
              disabled={isLoading || isUpdating}
              variant="outline"
              size="sm"
            >
              Test Frames
            </Button>
          </div>

          {/* Progress Bar */}
          {updateProgress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">
                📊 Update Progress
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Stage: {updateProgress.stage}</span>
                  <span>{updateProgress.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${updateProgress.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600">
                  Chunk {updateProgress.current_chunk} of{' '}
                  {updateProgress.total_chunks}({updateProgress.bytes_sent} /{' '}
                  {updateProgress.total_bytes} bytes)
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* File Info */}
          {firmwareFile && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">
                📁 Loaded Firmware File
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>
                  <strong>Name:</strong> {firmwareFile.fileName}
                </div>
                <div>
                  <strong>Type:</strong> {firmwareFile.fileType}
                </div>
                <div>
                  <strong>Size:</strong> {firmwareFile.fileSizeFormatted} (
                  {firmwareFile.fileSize} bytes)
                </div>
                <div>
                  <strong>CRC32:</strong> {firmwareFile.crc32}
                </div>
                <div>
                  <strong>Chunks:</strong> {firmwareFile.estimatedChunks} ×{' '}
                  {(firmwareFile.chunkSize / 1024).toFixed(1)}KB
                </div>
                <div>
                  <strong>Est. Transfer Time:</strong>{' '}
                  {firmwareFile.estimatedTimeFormatted}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className="text-green-600">Ready for update</span>
                </div>
              </div>
            </div>
          )}

          {/* Debug Log Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-800">📝 Debug Log</h4>
              <span className="text-xs text-gray-500">
                {debugLogs.length} entries
              </span>
            </div>
            <textarea
              ref={debugTextAreaRef}
              value={debugLogs.join('\n')}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-none overflow-y-auto"
              placeholder="Debug messages will appear here..."
              style={{
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                height: '512px',
              }}
            />
          </div>

          {/* Connection Status */}
          <div className="text-sm text-gray-600">
            <strong>Connection Status:</strong>{' '}
            {isConnected ? (
              <span className="text-green-600">
                ✅ Connected to {connectedPort}
              </span>
            ) : (
              <span className="text-red-600">
                ❌ Not connected - Please connect to a device first
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirmwareUpdate;
