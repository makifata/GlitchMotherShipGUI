import { getEnvironment, safeInvoke } from '@/lib/tauriUtils';
import { invoke } from '@tauri-apps/api/core';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

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

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface ConnectionContextType {
  // State
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connectedPort: string;
  availablePorts: COMPort[];
  isScanning: boolean;
  isDemoMode: boolean;
  error: string | null;
  isLoading: boolean;

  // Actions
  connect: (portName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshPorts: () => Promise<void>;
  clearError: () => void;

  // Tauri invoke wrapper with connection context
  invokeWithPort: <T>(
    command: string,
    args?: Record<string, any>
  ) => Promise<T>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
);

interface ConnectionProviderProps {
  children: ReactNode;
}

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

export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [connectedPort, setConnectedPort] = useState<string>('');
  const [availablePorts, setAvailablePorts] = useState<COMPort[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const environment = getEnvironment();

  // Load available COM ports on mount
  useEffect(() => {
    refreshPorts();
  }, []);

  const refreshPorts = async () => {
    setIsScanning(true);
    setError(null);

    try {
      // Try to use Tauri invoke first
      const ports: COMPortInfo[] = await safeInvoke('list_com_ports');

      // Convert to COMPort format with status
      const portsWithStatus: COMPort[] = ports.map(port => ({
        ...port,
        status:
          port.port === connectedPort ? 'connected' : ('available' as const),
      }));

      setAvailablePorts(portsWithStatus);
      setIsDemoMode(false);
    } catch (err) {
      // If Tauri is not available, switch to demo mode
      console.log('Tauri not available, switching to demo mode:', err);
      setIsDemoMode(true);

      // Simulate async port scanning for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      const demoPortsWithStatus: COMPort[] = mockPorts.map(port => ({
        ...port,
        status:
          port.port === connectedPort ? 'connected' : ('available' as const),
      }));
      setAvailablePorts(demoPortsWithStatus);
      setError(null); // Clear error in demo mode
    } finally {
      setIsScanning(false);
    }
  };

  const connect = async (portName: string) => {
    if (!portName) {
      setError('Please select a COM port first');
      return;
    }

    setConnectionStatus('connecting');
    setIsLoading(true);
    setError(null);

    try {
      if (!isDemoMode) {
        // Try real connection
        const result: string = await invoke('connect_port', { portName });
        console.log('Connect result:', result);
      } else {
        // Simulate connection for demo mode
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Update state
      setConnectedPort(portName);
      setIsConnected(true);
      setConnectionStatus('connected');

      // Update port status
      setAvailablePorts(ports =>
        ports.map(port =>
          port.port === portName ? { ...port, status: 'connected' } : port
        )
      );
    } catch (err) {
      setError(`Connection failed: ${err}`);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      console.error('Error connecting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!connectedPort) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!isDemoMode && isConnected) {
        const result: string = await invoke('disconnect_port', {
          portName: connectedPort,
        });
        console.log('Disconnect result:', result);
      }

      // Update state
      setConnectionStatus('disconnected');
      setIsConnected(false);
      const previousPort = connectedPort;
      setConnectedPort('');

      // Update port status back to available
      setAvailablePorts(ports =>
        ports.map(port =>
          port.port === previousPort ? { ...port, status: 'available' } : port
        )
      );
    } catch (err) {
      setError(`Disconnection failed: ${err}`);
      console.error('Error disconnecting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Wrapper for Tauri invoke calls that automatically includes the connected port
  const invokeWithPort = async <T,>(
    command: string,
    args: Record<string, any> = {}
  ): Promise<T> => {
    if (!isConnected || !connectedPort) {
      throw new Error('Not connected to any COM port');
    }

    return invoke<T>(command, {
      portName: connectedPort,
      ...args,
    });
  };

  const contextValue: ConnectionContextType = {
    // State
    isConnected,
    connectionStatus,
    connectedPort,
    availablePorts,
    isScanning,
    isDemoMode,
    error,
    isLoading,

    // Actions
    connect,
    disconnect,
    refreshPorts,
    clearError,
    invokeWithPort,
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};

// Custom hook to use the connection context
export const useConnection = (): ConnectionContextType => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};
