import {
  formatFirmwareInfoSummary,
  formatHardwareInfoSummary,
  isValidFirmwareInfo,
  isValidHardwareInfo,
} from '@/lib/formatters';
import type {
  FirmwareVersionInfo,
  HardwareInfo,
} from '@/types/ConnectionTypes';

interface DeviceInfoBoxProps {
  hardwareInfo: HardwareInfo | null;
  firmwareVersionInfo: FirmwareVersionInfo | null;
  className?: string;
}

const DeviceInfoBox: React.FC<DeviceInfoBoxProps> = ({
  hardwareInfo,
  firmwareVersionInfo,
  className = '',
}) => {
  const hasValidHardware = isValidHardwareInfo(hardwareInfo);
  const hasValidFirmware = isValidFirmwareInfo(firmwareVersionInfo);

  // Always show the box when connected, even if device info is unavailable
  return (
    <div
      className={`mt-4 p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm max-w-3xl mx-auto ${className}`}
    >
      <div className="text-sm text-gray-700 space-y-1">
        {hasValidHardware ? (
          <div>
            <span className="font-semibold">Hardware:</span>{' '}
            {formatHardwareInfoSummary(hardwareInfo)}
          </div>
        ) : (
          <div>
            <span className="font-semibold">Hardware:</span>{' '}
            <span className="text-orange-600">
              Info unavailable (check GCP communication)
            </span>
          </div>
        )}

        {hasValidFirmware ? (
          <div>
            <span className="font-semibold">Firmware:</span>{' '}
            {formatFirmwareInfoSummary(firmwareVersionInfo)}
          </div>
        ) : (
          <div>
            <span className="font-semibold">Firmware:</span>{' '}
            <span className="text-orange-600">
              Info unavailable (check GCP communication)
            </span>
          </div>
        )}

        {!hasValidHardware && !hasValidFirmware && (
          <div className="text-xs text-orange-600 mt-2">
            💡 Device info couldn't be retrieved. Check debug logs for GCP
            communication errors.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceInfoBox;
