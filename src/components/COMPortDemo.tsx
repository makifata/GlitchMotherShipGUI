import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

interface COMPort {
  port: string;
  description: string;
  manufacturer?: string;
  status: 'available' | 'busy' | 'connected';
}

const COMPortDemo = () => {
  const [availablePorts, setAvailablePorts] = useState<COMPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [isScanning, setIsScanning] = useState(false);

  // Mock COM ports data - in a real app this would come from Tauri backend
  const mockPorts: COMPort[] = [
    {
      port: 'COM1',
      description: 'Communications Port (COM1)',
      status: 'available',
    },
    {
      port: 'COM3',
      description: 'USB Serial Port (COM3)',
      manufacturer: 'FTDI',
      status: 'available',
    },
    {
      port: 'COM4',
      description: 'Arduino Uno (COM4)',
      manufacturer: 'Arduino LLC',
      status: 'available',
    },
    {
      port: 'COM5',
      description: 'USB to UART Bridge (COM5)',
      manufacturer: 'Silicon Labs',
      status: 'available',
    },
    {
      port: 'COM7',
      description: 'Bluetooth Serial Port (COM7)',
      status: 'busy',
    },
    {
      port: 'COM8',
      description: 'Virtual Serial Port (COM8)',
      status: 'available',
    },
    {
      port: 'COM12',
      description: 'ESP32 Dev Module (COM12)',
      manufacturer: 'Espressif',
      status: 'available',
    },
    {
      port: 'COM15',
      description: 'CH340 Serial Port (COM15)',
      manufacturer: 'WCH',
      status: 'available',
    },
  ];

  useEffect(() => {
    // Simulate initial port scan
    scanPorts();
  }, []);

  const scanPorts = async () => {
    setIsScanning(true);
    // Simulate async port scanning
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAvailablePorts(mockPorts);
    setIsScanning(false);
  };

  const handleConnect = async () => {
    if (!selectedPort) return;

    setConnectionStatus('connecting');

    // Simulate connection attempt
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update port status to connected
    setAvailablePorts(ports =>
      ports.map(port =>
        port.port === selectedPort ? { ...port, status: 'connected' } : port
      )
    );

    setConnectionStatus('connected');
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          COM Port Manager
          <div className="flex items-center gap-2">
            {getConnectionStatusBadge()}
          </div>
        </CardTitle>
        <CardDescription>
          Select and connect to serial communication ports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Port Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Port:</label>
          <Select
            value={selectedPort}
            onValueChange={setSelectedPort}
            disabled={connectionStatus === 'connected'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a COM port..." />
            </SelectTrigger>
            <SelectContent>
              {availablePorts.map(port => (
                <SelectItem
                  key={port.port}
                  value={port.port}
                  disabled={port.status === 'busy'}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {port.port} - {port.description}
                    </span>
                    {getStatusBadge(port.status)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Ports List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Available Ports:</label>
            <Button
              variant="outline"
              size="sm"
              onClick={scanPorts}
              disabled={isScanning}
            >
              {isScanning ? 'Scanning...' : 'Refresh'}
            </Button>
          </div>
          <Card>
            <ScrollArea className="h-48 w-full rounded-md border">
              <div className="p-4">
                {availablePorts.length === 0 && !isScanning && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No COM ports found
                  </p>
                )}
                {isScanning && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Scanning for ports...
                  </p>
                )}
                <div className="space-y-3">
                  {availablePorts.map((port, index) => (
                    <div
                      key={port.port}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        selectedPort === port.port
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{port.port}</div>
                        <div className="text-sm text-muted-foreground">
                          {port.description}
                        </div>
                        {port.manufacturer && (
                          <div className="text-xs text-muted-foreground">
                            Manufacturer: {port.manufacturer}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">{getStatusBadge(port.status)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Connection Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={
              !selectedPort ||
              connectionStatus !== 'disconnected' ||
              availablePorts.find(p => p.port === selectedPort)?.status ===
                'busy'
            }
            className="flex-1"
          >
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={connectionStatus === 'disconnected'}
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>

        {/* Connection Info */}
        {connectionStatus === 'connected' && selectedPort && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="text-sm">
                <strong>Connected to:</strong> {selectedPort}
                <br />
                <strong>Status:</strong> Ready for communication
                <br />
                <strong>Baud Rate:</strong> 9600 (default)
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default COMPortDemo;
