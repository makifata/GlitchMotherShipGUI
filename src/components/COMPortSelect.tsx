import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getEnvironment, safeInvoke } from '@/lib/tauriUtils';
import { useEffect, useState } from 'react';

interface COMPortInfo {
  port: string;
  description: string;
  manufacturer?: string;
  serial_number?: string;
  vendor_id?: number;
  product_id?: number;
  port_type: string;
}

interface COMPort extends COMPortInfo {
  status: 'available' | 'busy' | 'connected';
}

interface COMPortSelectProps {
  onConnect?: (portName: string) => void;
}

const COMPortSelect = ({ onConnect }: COMPortSelectProps) => {
  const [availablePorts, setAvailablePorts] = useState<COMPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const environment = getEnvironment();

  // Mock COM ports data for demo mode
  const mockPorts: COMPort[] = [
    {
      port: 'COM1',
      description: 'Communications Port (COM1)',
      manufacturer: 'Generic',
      serial_number: 'SN001',
      vendor_id: 0x1234,
      product_id: 0x5678,
      port_type: 'Physical',
      status: 'available',
    },
    {
      port: 'COM3',
      description: 'USB Serial Port (COM3)',
      manufacturer: 'FTDI',
      serial_number: 'FT123456',
      vendor_id: 0x0403,
      product_id: 0x6001,
      port_type: 'USB',
      status: 'available',
    },
    {
      port: 'COM4',
      description: 'Arduino Uno (COM4)',
      manufacturer: 'Arduino LLC',
      serial_number: 'AR789012',
      vendor_id: 0x2341,
      product_id: 0x0043,
      port_type: 'USB',
      status: 'available',
    },
  ];

  useEffect(() => {
    // Log environment info for debugging
    console.log('Environment detection:', {
      environment,
      isDemoMode,
      windowTauri:
        typeof window !== 'undefined' ? '__TAURI__' in window : false,
      windowTauriInternals:
        typeof window !== 'undefined' ? '__TAURI_INTERNALS__' in window : false,
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      location:
        typeof window !== 'undefined' ? window.location.href : 'unknown',
    });

    // Scan for ports on component mount
    scanPorts();
  }, []);

  const scanPorts = async () => {
    setIsScanning(true);
    setError(null);

    try {
      // Try to use Tauri invoke first
      const ports: COMPortInfo[] = await safeInvoke('list_com_ports');

      // Convert to COMPort format with status
      const portsWithStatus: COMPort[] = ports.map(port => ({
        ...port,
        status: 'available' as const,
      }));

      setAvailablePorts(portsWithStatus);
      setIsDemoMode(false);
    } catch (err) {
      // If Tauri is not available, switch to demo mode
      console.log('Tauri not available, switching to demo mode:', err);
      setIsDemoMode(true);

      // Simulate async port scanning for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAvailablePorts(mockPorts);
      setError(null); // Clear error in demo mode
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort) return;

    setConnectionStatus('connecting');

    // Simulate connection attempt (replace with actual connection logic later)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update port status to connected
    setAvailablePorts(ports =>
      ports.map(port =>
        port.port === selectedPort ? { ...port, status: 'connected' } : port
      )
    );

    setConnectionStatus('connected');

    // Call the onConnect callback to notify parent component
    if (onConnect) {
      onConnect(selectedPort);
    }
  };

  const handleDisconnect = async () => {
    setConnectionStatus('disconnected');

    // Update port status back to available
    setAvailablePorts(ports =>
      ports.map(port =>
        port.port === selectedPort ? { ...port, status: 'available' } : port
      )
    );
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
              onClick={scanPorts}
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
