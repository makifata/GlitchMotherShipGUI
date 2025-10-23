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
import { useState } from 'react';

// Import the COMPort type from the context
type COMPort = {
  port: string;
  description: string;
  manufacturer?: string;
  serial_number?: string;
  vendor_id?: number;
  product_id?: number;
  port_type: string;
  status: 'available' | 'busy' | 'connected';
};

const COMPortSelect = () => {
  const {
    availablePorts,
    connectionStatus,
    isScanning,
    error,
    isDemoMode,
    connect,
    refreshPorts,
    clearError,
  } = useConnection();

  const [selectedPort, setSelectedPort] = useState<string>('');

  const handleConnect = async () => {
    if (!selectedPort) return;
    await connect(selectedPort);
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
        {connectionStatus === 'connected' && selectedPort && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm">
              <strong>Connected to:</strong> {selectedPort}
              <br />
              <strong>Status:</strong> Ready for communication
              <br />
              <strong>Baud Rate:</strong> 9600 (default)
              {(() => {
                const portInfo = availablePorts.find(
                  p => p.port === selectedPort
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default COMPortSelect;
