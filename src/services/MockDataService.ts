import type {
  COMPort,
  FirmwareVersionInfo,
  HardwareInfo,
} from '@/types/ConnectionTypes';

// Mock COM ports data for demo mode
export const mockPorts: COMPort[] = [
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

// Mock hardware info for demo mode
export const mockHardwareInfo: HardwareInfo = {
  manufacture_date: 0x0a17, // October 23rd
  serial_number: 1234,
  board_type: 0x01, // DEV board
  hw_revision: 1,
  chip_model: 0x40, // Apollo4Lite
  features: 0x03, // USB + BLE
};

// Mock firmware version for demo mode
export const mockFirmwareInfo: FirmwareVersionInfo = {
  fw_version_major: 2,
  fw_version_minor: 1,
  fw_version_patch: 3,
  fw_version_suffix: [100, 101, 118], // 'dev' in ASCII
};

export class MockDataService {
  /**
   * Simulate async port scanning with delay
   */
  static async getAvailablePorts(): Promise<COMPort[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [...mockPorts];
  }

  /**
   * Simulate connection delay
   */
  static async simulateConnection(portName: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Connection simulation - no actual connection logic needed
  }

  /**
   * Get mock hardware info with delay
   */
  static async getHardwareInfo(): Promise<HardwareInfo> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...mockHardwareInfo };
  }

  /**
   * Get mock firmware info with delay
   */
  static async getFirmwareInfo(): Promise<FirmwareVersionInfo> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { ...mockFirmwareInfo };
  }

  /**
   * Update port status for demo mode
   */
  static updatePortStatus(
    ports: COMPort[],
    portName: string,
    status: COMPort['status']
  ): COMPort[] {
    return ports.map(port =>
      port.port === portName ? { ...port, status } : port
    );
  }
}
