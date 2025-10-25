import { safeInvoke } from '@/lib/tauriUtils';
import type { COMPort, COMPortInfo } from '@/types/ConnectionTypes';
import { invoke } from '@tauri-apps/api/core';
import { MockDataService } from './MockDataService';

export class PortService {
  /**
   * List available COM ports
   * @returns Promise<COMPort[]> - List of available ports with status
   */
  static async listAvailablePorts(connectedPort: string = ''): Promise<{
    ports: COMPort[];
    isDemoMode: boolean;
  }> {
    try {
      // Try to use Tauri invoke first
      const ports: COMPortInfo[] = await safeInvoke('list_com_ports');

      // Convert to COMPort format with status
      const portsWithStatus: COMPort[] = ports.map(port => ({
        ...port,
        status: port.port === connectedPort ? 'connected' : 'available',
      }));

      return {
        ports: portsWithStatus,
        isDemoMode: false,
      };
    } catch (err) {
      // If Tauri is not available, switch to demo mode
      console.log('Tauri not available, switching to demo mode:', err);

      const mockPorts = await MockDataService.getAvailablePorts();
      const portsWithStatus: COMPort[] = mockPorts.map(port => ({
        ...port,
        status: port.port === connectedPort ? 'connected' : 'available',
      }));

      return {
        ports: portsWithStatus,
        isDemoMode: true,
      };
    }
  }

  /**
   * Connect to a specific COM port
   * @param portName - Name of the port to connect to
   * @param isDemoMode - Whether we're in demo mode
   * @returns Promise<string> - Connection result message
   */
  static async connect(portName: string, isDemoMode: boolean): Promise<string> {
    if (!portName) {
      throw new Error('Please select a COM port first');
    }

    if (isDemoMode) {
      // Simulate connection for demo mode
      await MockDataService.simulateConnection(portName);
      return `Connected to ${portName} (Demo Mode)`;
    } else {
      // Try real connection
      const result: string = await invoke('connect_port', { portName });
      console.log('Connect result:', result);
      return result;
    }
  }

  /**
   * Disconnect from the current COM port
   * @param portName - Name of the port to disconnect from
   * @param isDemoMode - Whether we're in demo mode
   * @returns Promise<string> - Disconnection result message
   */
  static async disconnect(
    portName: string,
    isDemoMode: boolean
  ): Promise<string> {
    if (!portName) {
      throw new Error('No port connected');
    }

    if (isDemoMode) {
      // No actual disconnection needed in demo mode
      return `Disconnected from ${portName} (Demo Mode)`;
    } else {
      // Real disconnection
      const result: string = await invoke('disconnect_port', { portName });
      console.log('Disconnect result:', result);
      return result;
    }
  }

  /**
   * Update port status in the ports list
   * @param ports - Current ports list
   * @param portName - Port to update
   * @param status - New status
   * @returns Updated ports list
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

  /**
   * Reset all ports to available status except the specified connected port
   * @param ports - Current ports list
   * @param connectedPort - Currently connected port (if any)
   * @returns Updated ports list
   */
  static resetPortStatuses(
    ports: COMPort[],
    connectedPort: string = ''
  ): COMPort[] {
    return ports.map(port => ({
      ...port,
      status: port.port === connectedPort ? 'connected' : 'available',
    }));
  }
}
