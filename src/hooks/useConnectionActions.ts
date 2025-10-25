import { useConnection } from '@/contexts/ConnectionContext';
import { GCPService } from '@/services/GCPService';
import { PortService } from '@/services/PortService';
import { useEffect } from 'react';

/**
 * Custom hook that provides high-level connection actions
 * Combines the data-only context with service layer functionality
 */
export const useConnectionActions = () => {
  const {
    connectedPort,
    isDemoMode,
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
  } = useConnection();

  // Load available COM ports on mount
  useEffect(() => {
    const initializePorts = async () => {
      await refreshPorts();
    };
    initializePorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Refresh the list of available COM ports
   */
  const refreshPorts = async (): Promise<void> => {
    setIsScanning(true);
    setError(null);

    try {
      const { ports, isDemoMode: detectedDemoMode } =
        await PortService.listAvailablePorts(connectedPort);

      setAvailablePorts(ports);
      setIsDemoMode(detectedDemoMode);

      if (detectedDemoMode) {
        setError(null); // Clear error in demo mode
      }
    } catch (err) {
      setError(`Failed to refresh ports: ${err}`);
      console.error('Error refreshing ports:', err);
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * Connect to a COM port and get device information
   */
  const connectToPort = async (portName: string): Promise<void> => {
    if (!portName) {
      setError('Please select a COM port first');
      return;
    }

    setConnectionStatus('connecting');
    setIsLoading(true);
    setError(null);

    try {
      // Ensure we have the latest demo mode state
      const { isDemoMode: currentDemoMode } =
        await PortService.listAvailablePorts(connectedPort);
      setIsDemoMode(currentDemoMode);

      // Connect to the port with the correct mode
      const connectResult = await PortService.connect(
        portName,
        currentDemoMode
      );
      console.log('Connect result:', connectResult);

      // Update connection state
      setConnectedPort(portName);
      setIsConnected(true);
      setConnectionStatus('connected');

      // Update port status in the list
      setAvailablePorts(prevPorts =>
        PortService.updatePortStatus(prevPorts, portName, 'connected')
      );

      // Get device information after successful connection
      // Use the updated demo mode for device info retrieval
      try {
        const { hardwareInfo, firmwareInfo } = await GCPService.getDeviceInfo(
          portName,
          currentDemoMode
        );

        setHardwareInfo(hardwareInfo);
        setFirmwareVersionInfo(firmwareInfo);
      } catch (error) {
        console.warn('Failed to get device info:', error);
        // Don't fail the connection if device info fails, just log it
        setError(`Connected but failed to get device info: ${error}`);
      }
    } catch (err) {
      setError(`Connection failed: ${err}`);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      console.error('Error connecting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disconnect from the current COM port
   */
  const disconnectFromPort = async (): Promise<void> => {
    if (!connectedPort) return;

    setIsLoading(true);
    setError(null);

    try {
      const disconnectResult = await PortService.disconnect(
        connectedPort,
        isDemoMode
      );
      console.log('Disconnect result:', disconnectResult);

      // Clear device information
      setHardwareInfo(null);
      setFirmwareVersionInfo(null);

      // Update connection state
      setConnectionStatus('disconnected');
      setIsConnected(false);
      const previousPort = connectedPort;
      setConnectedPort('');

      // Update port status back to available
      setAvailablePorts(prevPorts =>
        PortService.updatePortStatus(prevPorts, previousPort, 'available')
      );
    } catch (err) {
      setError(`Disconnection failed: ${err}`);
      console.error('Error disconnecting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get hardware information from the connected device
   */
  const getHardwareInfo = async (): Promise<void> => {
    if (!connectedPort) {
      throw new Error('No port connected');
    }

    try {
      const hwInfo = await GCPService.getHardwareInfo(
        connectedPort,
        isDemoMode
      );
      setHardwareInfo(hwInfo);
    } catch (error) {
      console.warn('Failed to get hardware info:', error);
      setError(`Failed to get hardware info: ${error}`);
    }
  };

  /**
   * Get firmware version information from the connected device
   */
  const getFirmwareInfo = async (): Promise<void> => {
    if (!connectedPort) {
      throw new Error('No port connected');
    }

    try {
      const fwInfo = await GCPService.getFirmwareVersionInfo(
        connectedPort,
        isDemoMode
      );
      setFirmwareVersionInfo(fwInfo);
    } catch (error) {
      console.warn('Failed to get firmware info:', error);
      setError(`Failed to get firmware info: ${error}`);
    }
  };

  /**
   * Get both hardware and firmware information
   */
  const getDeviceInfo = async (): Promise<void> => {
    if (!connectedPort) {
      throw new Error('No port connected');
    }

    try {
      const { hardwareInfo, firmwareInfo } = await GCPService.getDeviceInfo(
        connectedPort,
        isDemoMode
      );

      setHardwareInfo(hardwareInfo);
      setFirmwareVersionInfo(firmwareInfo);
    } catch (error) {
      console.warn('Failed to get device info:', error);
      // Don't fail the connection if device info fails, just log it
      setError(`Connected but failed to get device info: ${error}`);
    }
  };

  /**
   * Clear any error messages
   */
  const clearError = (): void => {
    setError(null);
  };

  /**
   * Generic method for invoking GCP commands
   * Uses the GCPService with current connection context
   */
  const invokeGCPCommand = async <T>(
    command: string,
    args: Record<string, any> = {}
  ): Promise<T> => {
    if (!connectedPort) {
      throw new Error('No port connected');
    }

    return GCPService.invokeWithPort<T>(command, connectedPort, args);
  };

  return {
    // Actions
    refreshPorts,
    connectToPort,
    disconnectFromPort,
    getHardwareInfo,
    getFirmwareInfo,
    getDeviceInfo,
    clearError,
    invokeGCPCommand,
  };
};
