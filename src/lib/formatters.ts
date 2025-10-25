import type {
  FirmwareVersionInfo,
  HardwareInfo,
} from '@/types/ConnectionTypes';

/**
 * Centralized formatting utilities for hardware and firmware data
 * This ensures consistent data presentation across all components
 */

// Hardware Information Formatters
export const formatBoardType = (boardType: number): string => {
  switch (boardType) {
    case 0x01:
      return 'DEV (Development board)';
    case 0x10:
      return 'REV0 (Revision 0 production)';
    case 0x11:
      return 'REV1 (Revision 1 production)';
    case 0x12:
      return 'REV2 (Revision 2 production)';
    default:
      return `Unknown (0x${boardType
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()})`;
  }
};

export const formatBoardTypeShort = (boardType: number): string => {
  switch (boardType) {
    case 0x01:
      return 'DEV';
    case 0x10:
      return 'REV0';
    case 0x11:
      return 'REV1';
    case 0x12:
      return 'REV2';
    default:
      return `Unknown (0x${boardType
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()})`;
  }
};

export const formatChipModel = (chipModel: number): string => {
  switch (chipModel) {
    case 0x40:
      return 'Apollo4Lite (no native USB)';
    case 0x41:
      return 'Apollo4Plus (with USB controller)';
    case 0x42:
      return 'Apollo4Blue';
    default:
      return `Unknown (0x${chipModel
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()})`;
  }
};

export const formatChipModelShort = (chipModel: number): string => {
  switch (chipModel) {
    case 0x40:
      return 'Apollo4Lite';
    case 0x41:
      return 'Apollo4Plus';
    case 0x42:
      return 'Apollo4Blue';
    default:
      return `Unknown (0x${chipModel
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()})`;
  }
};

export const formatManufactureDate = (
  manufactureDate: number,
  format: 'detailed' | 'hex' = 'detailed'
): string => {
  if (format === 'hex') {
    // Custom hex format as shown in GCPCommunication
    return `0x${manufactureDate
      .toString(16)
      .padStart(4, '0')
      .toUpperCase()} (Custom Format)`;
  }

  // Detailed format with month names (Format: 0xMMDD where MM is month, DD is day)
  const month = (manufactureDate >> 8) & 0xff;
  const day = manufactureDate & 0xff;

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    return `${monthNames[month - 1]} ${day}, 2025`;
  }

  // Fallback to hex format if date seems invalid
  return `0x${manufactureDate.toString(16).padStart(4, '0').toUpperCase()}`;
};

export const formatFeatures = (features: number): string => {
  const featureList = [];

  // Standard GCP v2.2 feature flags
  if (features & 0x01) featureList.push('NATIVE_USB');
  if (features & 0x02) featureList.push('BLE');
  if (features & 0x04) featureList.push('EXT_MRAM_A');
  if (features & 0x08) featureList.push('EXT_MRAM_B');

  const reserved = [];
  if (features & 0x10) reserved.push('Bit4');
  if (features & 0x20) reserved.push('Bit5');
  if (features & 0x40) reserved.push('Bit6');
  if (features & 0x80) reserved.push('Bit7');

  let result = featureList.length > 0 ? featureList.join(', ') : 'None';
  if (reserved.length > 0) {
    result += ` (Reserved: ${reserved.join(', ')})`;
  }

  return `${result} [0x${features
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()}]`;
};

export const formatFeaturesSimple = (features: number): string => {
  const flags = [];

  // Simplified feature interpretation for UI display
  if (features & 0x01) flags.push('USB');
  if (features & 0x02) flags.push('BLE');
  if (features & 0x04) flags.push('WiFi');
  if (features & 0x08) flags.push('Audio');
  if (features & 0x10) flags.push('Camera');
  if (features & 0x20) flags.push('Display');
  if (features & 0x40) flags.push('Sensors');
  if (features & 0x80) flags.push('Storage');

  return flags.length > 0 ? flags.join(', ') : 'None';
};

// Firmware Information Formatters
export const formatFirmwareVersion = (fwInfo: FirmwareVersionInfo): string => {
  const suffix = fwInfo.fw_version_suffix
    .map((code: number) => String.fromCharCode(code))
    .join('')
    .replace(/\0/g, ''); // Remove null characters

  return `v${fwInfo.fw_version_major}.${fwInfo.fw_version_minor}.${
    fwInfo.fw_version_patch
  }${suffix ? `-${suffix}` : ''}`;
};

export const formatFirmwareVersionDetailed = (
  fwInfo: FirmwareVersionInfo
): string => {
  const suffix = String.fromCharCode(
    ...fwInfo.fw_version_suffix.filter(c => c !== 0)
  );

  return `v${fwInfo.fw_version_major}.${fwInfo.fw_version_minor}.${
    fwInfo.fw_version_patch
  }${suffix ? `-${suffix}` : ''}`;
};

// Status Data Formatters
export const formatTime = (time: number[]): string => {
  if (time.length < 6) return 'Invalid time';
  const [year, month, day, hour, min, sec] = time;
  return `20${year.toString().padStart(2, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour
    .toString()
    .padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec
    .toString()
    .padStart(2, '0')}`;
};

export const formatLedColor = (color: number): string => {
  return `#${color.toString(16).padStart(4, '0')}`;
};

// High-level hardware summary formatters
export const formatHardwareInfoSummary = (hwInfo: HardwareInfo): string => {
  return `SN: ${hwInfo.serial_number} | Board: ${formatBoardTypeShort(
    hwInfo.board_type
  )} | Chip: ${formatChipModelShort(hwInfo.chip_model)} | HW Rev: ${
    hwInfo.hw_revision
  }`;
};

export const formatFirmwareInfoSummary = (
  fwInfo: FirmwareVersionInfo
): string => {
  return formatFirmwareVersion(fwInfo);
};

// Validation helpers
export const isValidHardwareInfo = (
  hwInfo: HardwareInfo | null
): hwInfo is HardwareInfo => {
  return hwInfo !== null && typeof hwInfo === 'object';
};

export const isValidFirmwareInfo = (
  fwInfo: FirmwareVersionInfo | null
): fwInfo is FirmwareVersionInfo => {
  return fwInfo !== null && typeof fwInfo === 'object';
};
