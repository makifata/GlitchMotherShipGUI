import type {
  COMPort,
  ConnectionContextType,
  ConnectionStatus,
  FirmwareVersionInfo,
  HardwareInfo,
} from '@/types/ConnectionTypes';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
);

interface ConnectionProviderProps {
  children: ReactNode;
}

export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({
  children,
}) => {
  // State variables (data storage only)
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [connectedPort, setConnectedPort] = useState<string>('');
  const [availablePorts, setAvailablePorts] = useState<COMPort[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [firmwareVersionInfo, setFirmwareVersionInfo] =
    useState<FirmwareVersionInfo | null>(null);

  // Context value - data and setters only, no business logic
  const contextValue: ConnectionContextType = {
    // State (read-only data)
    isConnected,
    connectionStatus,
    connectedPort,
    availablePorts,
    isScanning,
    isDemoMode,
    error,
    isLoading,
    hardwareInfo,
    firmwareVersionInfo,

    // State setters (data modification only)
    setIsConnected,
    setConnectionStatus,
    setConnectedPort,
    setAvailablePorts,
    setIsScanning,
    setIsDemoMode,
    setError,
    setIsLoading,
    setHardwareInfo,
    setFirmwareVersionInfo,
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
