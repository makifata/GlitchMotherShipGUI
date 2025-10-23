# GlitchMotherShipGUI

A modern desktop application for communicating with Glitchi devices using the Glitchi Communication Protocol (GCP). Built with Tauri, React, TypeScript, and Rust.

## 🚀 Recent Updates - GCP v2.2 Implementation

### Major Protocol Enhancement (October 2025)

- **GCP v2.2 Support**: HELLO command now returns hardware identification data instead of status data
- **Hardware Discovery**: Enhanced device identification for compatibility checking
- **8-Byte Hardware Data Structure**:
  - Manufacturing date (custom format)
  - Serial number (0-65535)
  - Board type (DEV/REV0/REV1)
  - Hardware revision
  - Chip model (Apollo4Lite/Apollo4Plus)
  - Feature flags (NATIVE_USB, BLE, EXT_MRAM_A/B)
- **Backward Compatibility**: Graceful fallback for older firmware versions

## 📋 Features

### Communication Protocol

- **GCP v2.2** (Glitchi Communication Protocol)
- **UART Transport**: 115200 bps, 8N1, RTS/CTS flow control
- **Frame-based Protocol**: Preamble + Length + MsgType + Parameters + Data + CRC16
- **Error Handling**: CRC verification, timeout handling, retry logic

### Device Operations

- **Connection Management**: Persistent COM port connections
- **Hardware Identification**: Device discovery via HELLO command
- **Real-time Status Monitoring**: Battery, LED, system state, RTC time
- **Firmware Version Query**: Version information retrieval
- **Status Polling**: 1Hz continuous monitoring capability

### User Interface

- **Modern React UI**: Built with TypeScript and Tailwind CSS
- **Real-time Updates**: Live display of device status and hardware information
- **Connection Management**: Easy COM port selection and connection status
- **Data Visualization**: Formatted display of hardware fields and status data
- **Error Handling**: Clear error messages and status indicators

## 🏗️ Architecture

### Frontend (React + TypeScript)

- **Components**: Modular React components with TypeScript interfaces
- **Context API**: Global connection state management
- **UI Components**: shadcn/ui component library with Tailwind CSS
- **Real-time Updates**: WebSocket-like communication with Tauri backend

### Backend (Rust + Tauri)

- **GCP Implementation**: Full protocol implementation in Rust
- **Serial Communication**: Cross-platform serial port handling
- **Connection Pool**: Persistent connection management
- **Command Interface**: Type-safe Tauri commands for frontend integration

## 🛠️ Development Setup

### Prerequisites

- **Node.js** (v18 or later)
- **Rust** (latest stable)
- **Tauri CLI** (`cargo install tauri-cli`)

### Installation

```bash
# Clone the repository
git clone https://github.com/makifata/GlitchMotherShipGUI.git
cd GlitchMotherShipGUI

# Install frontend dependencies
npm install

# Install Rust dependencies (automatically handled by Tauri)
```

### Development

```bash
# Run in development mode (hot reload enabled)
npm run tauri:dev

# Build for production
npm run tauri:build

# Run frontend only (for UI development)
npm run dev
```

## 📡 GCP Protocol Details

### Frame Structure

```
┌─────────┬─────────┬─────────┬────────────┬──────┬─────────┐
│Preamble │ Length  │ MsgType │ Parameters │ Data │  CRC16  │
│ (2byte) │ (2byte) │ (2byte) │ (variable) │(var) │ (2byte) │
└─────────┴─────────┴─────────┴────────────┴──────┴─────────┘
```

### Key Commands

- **HELLO (0x0001)**: Connection establishment + hardware identification
- **GET_STATUS (0x2001)**: Real-time device status (15 bytes)
- **GET_FW_VERSION (0x2005)**: Firmware version information (6 bytes)
- **ACK/NACK (0x0002/0x0003)**: Command acknowledgments

### Hardware Data Structure (HELLO Response)

```rust
struct HWVersion {
    manufacture_date: u16,  // Custom date format
    serial_number: u16,     // Device serial (0-65535)
    board_type: u8,         // DEV=0x01, REV0=0x10, REV1=0x11
    hw_revision: u8,        // Hardware revision number
    chip_model: u8,         // Apollo4Lite=0x40, Apollo4Plus=0x41
    features: u8,           // Bit flags: USB, BLE, MRAM_A/B
}
```

## 📁 Project Structure

```
GlitchMotherShipGUI/
├── src/                    # React frontend
│   ├── components/         # React components
│   │   ├── GCPCommunication.tsx    # Main GCP interface
│   │   ├── COMPortSelect.tsx       # Port selection
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React context providers
│   └── lib/               # Utility functions
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── gcp.rs         # GCP protocol implementation
│   │   ├── lib.rs         # Tauri command handlers
│   │   └── main.rs        # Application entry point
│   └── Cargo.toml         # Rust dependencies
├── docs/                  # Documentation
├── gcp_spec_v22.md       # Protocol specification
└── README.md             # This file
```

## 🔧 Usage

### Connecting to a Device

1. **Select COM Port**: Choose from available serial ports
2. **Connect**: Establish connection to the device
3. **Send HELLO**: Retrieve hardware identification information
4. **Monitor Status**: Use polling for real-time status updates

### Hardware Information Display

The application displays comprehensive hardware details:

- **Manufacturing Date**: Custom encoded production date
- **Serial Number**: Unique device identifier
- **Board Type**: Development or production board revision
- **Chip Model**: Apollo4 variant with feature set
- **Feature Flags**: Available hardware capabilities (USB, BLE, MRAM)

### Status Monitoring

Real-time device status including:

- Battery level (0-100%)
- System state and LED status
- Current game index
- Real-time clock information

## 🧪 Testing

### Protocol Testing

The application includes comprehensive testing capabilities:

- **Connection establishment** with HELLO handshake
- **Hardware identification** parsing and display
- **Status data retrieval** and real-time updates
- **Error handling** for communication failures
- **Backward compatibility** with older firmware versions

### Debugging

- **Console logging** for protocol-level debugging
- **Raw data display** for detailed inspection
- **Connection status monitoring** with error reporting
- **Frame-level protocol analysis** capabilities

## 📚 Documentation

### Additional Resources

- `gcp_spec_v22.md` - Complete GCP v2.2 protocol specification
- `docs/` - Technical documentation and guides
- Inline code comments for implementation details

### Protocol Specification

The complete GCP v2.2 specification includes:

- Detailed frame structure and field definitions
- Complete command reference with examples
- Hardware data structure specifications
- Communication flow examples
- Error handling procedures
- CRC implementation details

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Update documentation as needed
5. Submit a pull request

### Code Standards

- **TypeScript**: Strict type checking enabled
- **Rust**: Follow standard Rust conventions
- **Protocol**: Maintain GCP specification compliance
- **Documentation**: Update README and specs for changes

## 📄 License

[Add your license information here]

## 🏷️ Version History

### v2.2.0 (October 2025)

- ✅ GCP v2.2 protocol implementation
- ✅ Hardware identification via HELLO command
- ✅ Enhanced device discovery capabilities
- ✅ Comprehensive hardware data formatting
- ✅ Backward compatibility support

### Previous Versions

- v2.1.x: Status data implementation
- v2.0.x: Core GCP protocol support
- v1.x: Initial application framework

---

**Built with modern technologies**: React + TypeScript + Tauri + Rust for cross-platform desktop application development.
