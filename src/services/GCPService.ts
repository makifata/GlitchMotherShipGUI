import type {
  FirmwareVersionInfo,
  HardwareInfo,
} from '@/types/ConnectionTypes';
import { invoke } from '@tauri-apps/api/core';
import { MockDataService } from './MockDataService';

export class GCPService {
  /**
   * Send HELLO command to get hardware information
   * @param portName - Name of the connected port
   * @param isDemoMode - Whether we're in demo mode
   * @returns Promise<HardwareInfo> - Hardware information
   */
  static async getHardwareInfo(
    portName: string,
    isDemoMode: boolean
  ): Promise<HardwareInfo> {
    if (!portName) {
      throw new Error('No port connected');
    }

    if (isDemoMode) {
      // Return mock data for demo mode
      return await MockDataService.getHardwareInfo();
    } else {
      // Send real HELLO command
      try {
        const hwInfo: HardwareInfo = await invoke('gcp_send_hello', {
          portName,
        });
        console.log('Hardware info received:', hwInfo);
        return hwInfo;
      } catch (error) {
        console.error('Failed to get hardware info via HELLO:', error);
        throw new Error(`Failed to get hardware info: ${error}`);
      }
    }
  }

  /**
   * Send GET_FW_VERSION command to get firmware version information
   * @param portName - Name of the connected port
   * @param isDemoMode - Whether we're in demo mode
   * @returns Promise<FirmwareVersionInfo> - Firmware version information
   */
  static async getFirmwareVersionInfo(
    portName: string,
    isDemoMode: boolean
  ): Promise<FirmwareVersionInfo> {
    if (!portName) {
      throw new Error('No port connected');
    }

    if (isDemoMode) {
      // Return mock data for demo mode
      return await MockDataService.getFirmwareInfo();
    } else {
      // Send real GET_FW_VERSION command
      try {
        const fwInfo: FirmwareVersionInfo = await invoke('gcp_get_fw_version', {
          portName,
        });
        console.log('Firmware version info received:', fwInfo);
        return fwInfo;
      } catch (error) {
        console.error('Failed to get firmware version info:', error);
        throw new Error(`Failed to get firmware version: ${error}`);
      }
    }
  }

  /**
   * Get both hardware and firmware information in one call
   * @param portName - Name of the connected port
   * @param isDemoMode - Whether we're in demo mode
   * @returns Promise with both hardware and firmware info
   */
  static async getDeviceInfo(
    portName: string,
    isDemoMode: boolean
  ): Promise<{
    hardwareInfo: HardwareInfo;
    firmwareInfo: FirmwareVersionInfo;
  }> {
    const [hardwareInfo, firmwareInfo] = await Promise.all([
      this.getHardwareInfo(portName, isDemoMode),
      this.getFirmwareVersionInfo(portName, isDemoMode),
    ]);

    return {
      hardwareInfo,
      firmwareInfo,
    };
  }

  /**
   * Generic method for invoking GCP commands with connected port
   * @param command - Tauri command name
   * @param portName - Name of the connected port
   * @param args - Additional arguments for the command
   * @returns Promise<T> - Command result
   */
  static async invokeWithPort<T>(
    command: string,
    portName: string,
    args: Record<string, any> = {}
  ): Promise<T> {
    if (!portName) {
      throw new Error('No port connected');
    }

    return invoke<T>(command, {
      portName, // Tauri automatically converts portName to port_name for backend
      ...args,
    });
  }
}
