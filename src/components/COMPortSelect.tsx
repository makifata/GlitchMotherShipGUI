import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConnection } from '@/contexts/ConnectionContext';
import { useConnectionActions } from '@/hooks/useConnectionActions';
import {
  formatBoardTypeShort,
  formatChipModelShort,
  formatFeaturesSimple,
  formatFirmwareVersion,
  formatManufactureDate,
} from '@/lib/formatters';
import type { COMPort } from '@/types/ConnectionTypes';
import { useState } from 'react';

const COMPortSelect = () => {
  // Get data from context
  const {
    availablePorts,
    connectionStatus,
    isScanning,
    error,
    isDemoMode,
    hardwareInfo,
    firmwareVersionInfo,
    connectedPort,
  } = useConnection();

  // Get actions from custom hook
  const { connectToPort, refreshPorts, clearError } = useConnectionActions();

  const [selectedPort, setSelectedPort] = useState<string>('');

  const handleConnect = async () => {
    if (!selectedPort) return;
    await connectToPort(selectedPort);
  };

  const getStatusBadge = (status: COMPort['status']) => {
    switch (status) {
      case 'available':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Available
          </Badge>
        );
      case 'busy':
        return <Badge variant="destructive">Busy</Badge>;
      case 'connected':
        return <Badge className="bg-blue-100 text-blue-800">Connected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'connecting':
        return (
          <Badge variant="outline" className="animate-pulse">
            Connecting...
          </Badge>
        );
      default:
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  return (
    <div className="w-full">
      {isDemoMode && (
        <div className="text-center mb-2">
          <span className="text-xs text-muted-foreground">Demo Mode</span>
        </div>
      )}

      <div>
        {/* Error Display */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md mb-3 text-xs text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Port Selection */}
        <div className="mb-3">
          <div className="flex gap-2">
            <Select
              value={selectedPort}
              onValueChange={setSelectedPort}
              disabled={connectionStatus === 'connected'}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a COM port..." />
              </SelectTrigger>
              <SelectContent>
                {availablePorts.map(port => (
                  <SelectItem
                    key={port.port}
                    value={port.port}
                    disabled={port.status === 'busy'}
                  >
                    <span>
                      {port.port} - {port.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              className="transparent-button"
              onClick={refreshPorts}
              disabled={isScanning}
            >
              {isScanning ? 'Scanning...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Connection Controls */}
        <div>
          <Button
            onClick={handleConnect}
            disabled={
              !selectedPort ||
              connectionStatus !== 'disconnected' ||
              availablePorts.find(p => p.port === selectedPort)?.status ===
                'busy'
            }
            className="w-full"
          >
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
          </Button>
        </div>

        {/* Connection Info */}
        {connectionStatus === 'connected' && connectedPort && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm">
              <strong>Connected to:</strong> {connectedPort}
              <br />
              <strong>Status:</strong> Ready for communication
              <br />
              <strong>Baud Rate:</strong> 115200
              {(() => {
                const portInfo = availablePorts.find(
                  p => p.port === connectedPort
                );
                if (portInfo?.manufacturer) {
                  return (
                    <>
                      <br />
                      <strong>Manufacturer:</strong> {portInfo.manufacturer}
                    </>
                  );
                }
                return null;
              })()}
              {/* Hardware Information from HELLO command */}
              {hardwareInfo && (
                <>
                  <hr className="my-2 border-green-300" />
                  <div className="font-semibold text-green-800 mb-1">
                    Hardware Information:
                  </div>
                  <strong>Serial Number:</strong> {hardwareInfo.serial_number}
                  <br />
                  <strong>Board Type:</strong>{' '}
                  {formatBoardTypeShort(hardwareInfo.board_type)}
                  <br />
                  <strong>Hardware Revision:</strong> {hardwareInfo.hw_revision}
                  <br />
                  <strong>Chip Model:</strong>{' '}
                  {formatChipModelShort(hardwareInfo.chip_model)}
                  <br />
                  <strong>Manufacturing Date:</strong>{' '}
                  {formatManufactureDate(hardwareInfo.manufacture_date)}
                  <br />
                  <strong>Features:</strong>{' '}
                  {formatFeaturesSimple(hardwareInfo.features)}
                </>
              )}
              {/* Firmware Version Information from GET_FW_VERSION command */}
              {firmwareVersionInfo && (
                <>
                  <hr className="my-2 border-green-300" />
                  <div className="font-semibold text-green-800 mb-1">
                    Firmware Information:
                  </div>
                  <strong>Firmware Version:</strong>{' '}
                  {formatFirmwareVersion(firmwareVersionInfo)}
                  <br />
                  <strong>Version Details:</strong> v
                  {firmwareVersionInfo.fw_version_major}.
                  {firmwareVersionInfo.fw_version_minor}.
                  {firmwareVersionInfo.fw_version_patch}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default COMPortSelect;
