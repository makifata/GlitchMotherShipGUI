// COM Port related types
export interface COMPortInfo {
  port: string;
  description: string;
  manufacturer?: string;
  serial_number?: string;
  vendor_id?: number;
  product_id?: number;
  port_type: string;
}

export interface COMPort extends COMPortInfo {
  status: 'available' | 'busy' | 'connected';
}

// Hardware information types
export interface HardwareInfo {
  manufacture_date: number;
  serial_number: number;
  board_type: number;
  hw_revision: number;
  chip_model: number;
  features: number;
}

// Firmware information types
export interface FirmwareVersionInfo {
  fw_version_major: number;
  fw_version_minor: number;
  fw_version_patch: number;
  fw_version_suffix: number[];
}

// Connection status types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// Context interface for data storage only
export interface ConnectionContextType {
  // State (data storage only)
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connectedPort: string;
  availablePorts: COMPort[];
  isScanning: boolean;
  isDemoMode: boolean;
  error: string | null;
  isLoading: boolean;
  hardwareInfo: HardwareInfo | null;
  firmwareVersionInfo: FirmwareVersionInfo | null;

  // State setters (data modification only)
  setIsConnected: (connected: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setConnectedPort: (port: string) => void;
  setAvailablePorts: (
    ports: COMPort[] | ((prev: COMPort[]) => COMPort[])
  ) => void;
  setIsScanning: (scanning: boolean) => void;
  setIsDemoMode: (demoMode: boolean) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setHardwareInfo: (info: HardwareInfo | null) => void;
  setFirmwareVersionInfo: (info: FirmwareVersionInfo | null) => void;
}
