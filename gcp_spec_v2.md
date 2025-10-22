# Glitchi Communication Protocol (GCP) v2.1

## Protocol Overview

- **Name**: Glitchi Communication Protocol (GCP)
- **Version**: 2.1
- **Transport**: UART (115200 bps, 8N1, RTS/CTS flow control)
- **Host Implementation**: Rust
- **MCU Implementation**: C
- **Purpose**: Communication with Glitchi device (firmware updates, state management, game data exchange)

---

## 1. Basic Frame Structure

```
┌─────────┬─────────┬─────────┬────────────┬──────┬─────────┐
│Preamble │ Length  │ MsgType │ Parameters │ Data │  CRC16  │
│ (2byte) │ (2byte) │ (2byte) │ (variable) │(var) │ (2byte) │
└─────────┴─────────┴─────────┴────────────┴──────┴─────────┘
```

### Fields

- **Preamble**: `0xAA 0x55` (fixed frame start marker)
- **Length**: Total byte count including Length field itself (excluding Preamble and CRC16)
- **MsgType**: Command type (2 bytes)
- **Parameters**: Command-specific parameters (variable length)
- **Data**: Payload data (variable length)
- **CRC16**: CRC-16-CCITT (polynomial: 0x1021, initial: 0xFFFF)
  - Calculation range: Length through Data (excluding Preamble)

### Endianness

**All multi-byte fields use little-endian byte order**

Example: `Length = 0x1234` → `[0x34][0x12]`

---

## 2. Command Definitions

### 2.1 Basic Control Commands (0x00xx)

| Command | Value | Description |
|---------|-------|-------------|
| GCP_MSG_HELLO | 0x0001 | Connection establishment |
| GCP_MSG_ACK | 0x0002 | Positive acknowledgment |
| GCP_MSG_NACK | 0x0003 | Negative acknowledgment |
| GCP_MSG_RESET | 0x0004 | Device reset |
| GCP_MSG_PING | 0x0005 | Keep-alive check |

### 2.2 Firmware Update Commands (0x10xx)

| Command | Value | Description |
|---------|-------|-------------|
| GCP_MSG_FW_UPDATE_START | 0x1001 | Start firmware update |
| GCP_MSG_FW_UPDATE_DATA | 0x1002 | Firmware data chunk |
| GCP_MSG_FW_UPDATE_END | 0x1003 | Firmware update complete |
| GCP_MSG_FW_UPDATE_ABORT | 0x1004 | Abort firmware update |
| GCP_MSG_FW_UPDATE_REQUEST | 0x1005 | Request firmware update (MCU→Host) |
| GCP_MSG_FW_NO_UPDATE_AVAILABLE | 0x1006 | No firmware update available (Host→MCU) |

### 2.3 State & Configuration Commands (0x20xx)

| Command | Value | Description |
|---------|-------|-------------|
| GCP_MSG_GET_STATUS | 0x2001 | Get real-time device status |
| GCP_MSG_SET_CONFIG | 0x2002 | Update configuration |
| GCP_MSG_GET_INFO | 0x2003 | Get device information |
| GCP_MSG_GET_DIAGNOSTICS | 0x2004 | Get diagnostic counters |
| GCP_MSG_GET_FW_VERSION | 0x2005 | Get firmware version |

### 2.4 Game & NN Commands (0x30xx)

**Note:** All Game & NN commands (GET_GENE, SET_GENE, GET_ACHIEVEMENT, GENE_DATA) are reserved for future implementation.

---

## 3. Error Codes

| Error Code | Value | Description |
|------------|-------|-------------|
| GCP_ERROR_CRC | 0x0001 | CRC verification failed |
| GCP_ERROR_SEQ | 0x0002 | Sequence number mismatch |
| GCP_ERROR_SIZE | 0x0003 | Invalid size |
| GCP_ERROR_TIMEOUT | 0x0004 | Timeout occurred |
| GCP_ERROR_MRAM | 0x0005 | MRAM write error |
| GCP_ERROR_UNKNOWN_CMD | 0x0006 | Unknown command |
| GCP_ERROR_INVALID_PARAM | 0x0007 | Invalid parameter |
| GCP_ERROR_BUSY | 0x0008 | Device busy |

---

## 4. Command Specifications

### 4.1 GCP_MSG_HELLO (Connection Establishment)

**Request:**
```
┌──┬──┬────┬──────┬──────┬────┐
│AA│55│ 06 │ 01 00│ 00 00│CRC │
│  │  │ 00 │      │      │    │
└──┴──┴────┴──────┴──────┴────┘
  Len=6  HELLO   reserved
```

**Response: Status Data (same as GET_STATUS)**
```
┌──┬──┬────┬──────┬─────────────────┬────┐
│AA│55│ 17 │ 02 00│ Status Data (15B)│CRC │
│  │  │ 00 │      │                 │    │
└──┴──┴────┴──────┴─────────────────┴────┘
```

**Note:** HELLO response returns the complete device status, identical to GET_STATUS response.

---

### 4.2 GCP_MSG_ACK / GCP_MSG_NACK

**ACK Frame:**
```
┌──┬──┬────┬──────┬──────┬──────┬────┐
│AA│55│ 08 │ 02 00│MsgTyp│SeqNo │CRC │
│  │  │ 00 │      │(2B)  │(4B)  │    │
└──┴──┴────┴──────┴──────┴──────┴────┘
```
- **MsgType**: Command being acknowledged
- **SeqNo**: Sequence number (used in data transfer, 0 otherwise)

**NACK Frame:**
```
┌──┬──┬────┬──────┬──────┬──────┬──────┬────┐
│AA│55│ 0A │ 03 00│MsgTyp│SeqNo │Error │CRC │
│  │  │ 00 │      │(2B)  │(4B)  │(2B)  │    │
└──┴──┴────┴──────┴──────┴──────┴──────┴────┘
```
- **Error**: Error code (see Error Codes section)

**Note:** ACK/NACK frames are used for simple acknowledgments. HELLO command returns state data directly, not via ACK frame.

---

### 4.3 GCP_MSG_FW_UPDATE_START

**Request:**
```
┌──┬──┬────┬──────┬──────┬──────┬──────┬──────┬────┐
│AA│55│ 12 │ 01 10│ Size │CRC32 │Chunk │Resv │CRC │
│  │  │ 00 │      │(4B)  │(4B)  │(2B)  │(2B) │    │
└──┴──┴────┴──────┴──────┴──────┴──────┴──────┴────┘
```

**Parameters:**
- **Size** (4 bytes): Total firmware size in bytes
- **CRC32** (4 bytes): CRC32 of entire firmware
- **Chunk** (2 bytes): Recommended chunk size (e.g., 2036)
- **Reserved** (2 bytes): Must be 0

**Response:** ACK or NACK

---

### 4.4 GCP_MSG_FW_UPDATE_DATA

**Request:**
```
┌──┬──┬──────┬──────┬──────┬───────────┬────┐
│AA│55│Length│ 02 10│SeqNo │  FW Data  │CRC │
│  │  │      │      │(4B)  │ (variable)│    │
└──┴──┬──────┴──────┴──────┴───────────┴────┘
```

**Parameters:**
- **SeqNo** (4 bytes): Offset position in bytes
- **FW Data**: Firmware chunk data (max 2036 bytes recommended)

**Response:** ACK with SeqNo or NACK

**Transfer Process:**
1. Host sends multiple DATA frames with sequential offsets
2. MCU writes each chunk to MRAM at specified offset
3. MCU calculates running CRC32
4. After all chunks, MCU verifies total CRC32 against START command

---

### 4.5 GCP_MSG_FW_UPDATE_END

**Request:**
```
┌──┬──┬────┬──────┬──────┬────┐
│AA│55│ 06 │ 03 10│ 00 00│CRC │
│  │  │ 00 │      │      │    │
└──┴──┴────┴──────┴──────┴────┘
```

**Response: ACK with Verification Result**
```
┌──┬──┬────┬──────┬──────┬──────┬──────┬────┐
│AA│55│ 0C │ 02 00│ 03 10│ 0000 │Result│CRC │
│  │  │ 00 │      │      │      │(4B)  │    │
└──┴──┴────┴──────┴──────┴──────┴──────┴────┘
```

**Result Values:**
- `0x00000000`: CRC32 match, firmware ready to apply
- `0xFFFFFFFF`: CRC32 mismatch, update failed

---

### 4.6 GCP_MSG_FW_UPDATE_REQUEST (Device-Initiated Update Check)

**Request (MCU→Host):**
```
┌──┬──┬────┬──────┬─────────────────────┬────┐
│AA│55│ 0C │ 05 10│ FW Version Data (6B)│CRC │
│  │  │ 00 │      │                     │    │
└──┴──┴────┴──────┴─────────────────────┴────┘
```

**Firmware Version Request Structure (6 bytes):**
```c
typedef struct {
    uint8_t  currentFwMajor;    // Current FW_VERSION_MAJOR
    uint8_t  currentFwMinor;    // Current FW_VERSION_MINOR  
    uint8_t  currentFwPatch;    // Current FW_VERSION_PATCH
    char     currentFwSuffix[3]; // Current FW_VERSION_SUFFIX (3 chars, e.g., "a", "rc1", "bet")
} gcp_fw_update_request_t;
```

**Response Options:**
1. **Update Available**: Host responds with `GCP_MSG_FW_UPDATE_START`
2. **No Update Available**: Host responds with `GCP_MSG_FW_NO_UPDATE_AVAILABLE`

**Note:** Device sends this when user selects firmware update in GUI. Host checks online for newer firmware and responds accordingly.

---

### 4.7 GCP_MSG_FW_NO_UPDATE_AVAILABLE

**Response (Host→MCU):**
```
┌──┬──┬────┬──────┬──────┬────┐
│AA│55│ 06 │ 06 10│ 00 00│CRC │
│  │  │ 00 │      │      │    │
└──┴──┴────┴──────┴──────┴────┘
```

**Note:** Simple response indicating no firmware update is available. Device should exit firmware update mode and return to normal operation.

---

### 4.8 GCP_MSG_RESET

**Request:**
```
┌──┬──┬────┬──────┬──────┬────┐
│AA│55│ 06 │ 04 00│ Type │CRC │
│  │  │ 00 │      │(2B)  │    │
└──┴──┴────┴──────┴──────┴────┘
```

**Type Values:**
- `0x0001`: Software reset
- `0x0002`: Apply firmware update and reset (MRAM→Flash)

**Response:** ACK, then device reboots

---

### 4.9 GCP_MSG_GET_STATUS

**Request:**
```
┌──┬──┬────┬──────┬──────┬────┐
│AA│55│ 06 │ 01 20│ 00 00│CRC │
│  │  │ 00 │      │      │    │
└──┴──┴────┴──────┴──────┴────┘
```

**Response:**
```
┌──┬──┬────┬──────┬──────┬─────────────────┬────┐
│AA│55│ 17 │ 02 00│ 01 20│ Status Data (15B)│CRC │
│  │  │ 00 │      │      │                 │    │
└──┴──┴────┴──────┴──────┴─────────────────┴────┘
```

**Status Data Structure (15 bytes):**
```c
typedef struct {
    uint8_t  batteryLevel;      // 0-100% (hwstatus.Battery.BatteryLevel)
    uint8_t  systemState;       // Current system state (mainstate - SystemState_m)
    uint16_t ledColor;          // LED color (hwstatus.StatusLED.color)
    uint8_t  ledBrightness;     // LED brightness (hwstatus.StatusLED.brightness)
    uint16_t currentGameIdx;    // Current game index (sysconfig.GameIdx)
    uint8_t  rtcTime[8];        // [year, month, day, hour, min, sec, weekday, hundredths]
} gcp_status_data_t;
```

---

### 4.10 GCP_MSG_GET_DIAGNOSTICS

**Request:**
```
┌──┬──┬────┬──────┬──────┬────┐
│AA│55│ 06 │ 04 20│ 00 00│CRC │
│  │  │ 00 │      │      │    │
└──┴──┴────┴──────┴──────┴────┘
```

**Response:**
```
┌──┬──┬────┬──────┬──────┬─────────────────────┬────┐
│AA│55│ 28 │ 02 00│ 04 20│ Diagnostics Data (32B)│CRC │
│  │  │ 00 │      │      │                     │    │
└──┴──┴────┴──────┴──────┴─────────────────────┴────┘
```

**Diagnostics Data Structure (32 bytes):**
```c
typedef struct {
    uint32_t stepCounter;       // counters.StepCounter
    uint32_t fullPowerTime;     // counters.FullPowerTime  
    uint32_t silentTime;        // counters.SilentTime
    uint32_t chargingTime;      // counters.ChargingTime
    uint32_t btnCounterL;       // counters.BtnCounterL
    uint32_t btnCounterR;       // counters.BtnCounterR
    uint32_t framRead;          // counters.FRAMRead
    uint32_t framWrite;         // counters.FRAMWrite
} gcp_diagnostics_data_t;
```

---

### 4.11 GCP_MSG_GET_FW_VERSION

**Request:**
```
┌──┬──┬────┬──────┬──────┬────┐
│AA│55│ 06 │ 05 20│ 00 00│CRC │
│  │  │ 00 │      │      │    │
└──┴──┴────┴──────┴──────┴────┘
```

**Response:**
```
┌──┬──┬────┬──────┬──────┬─────────────────────┬────┐
│AA│55│ 0C │ 02 00│ 05 20│ FW Version Data (6B)│CRC │
│  │  │ 00 │      │      │                     │    │
└──┴──┴────┴──────┴──────┴─────────────────────┴────┘
```

**Firmware Version Data Structure (6 bytes):**
```c
typedef struct {
    uint8_t  fwVersionMajor;    // FW_VERSION_MAJOR
    uint8_t  fwVersionMinor;    // FW_VERSION_MINOR  
    uint8_t  fwVersionPatch;    // FW_VERSION_PATCH
    char     fwVersionSuffix[3]; // FW_VERSION_SUFFIX (3 chars, e.g., "a", "rc1", "bet")
} gcp_fw_version_data_t;
```

---

### 4.12 GCP_MSG_SET_CONFIG

**Request:**
```
┌──┬──┬──────┬──────┬──────┬──────┬───────────┬────┐
│AA│55│Length│ 02 20│SubCmd│Resv │Config Data│CRC │
│  │  │      │      │(2B)  │(2B) │ (variable)│    │
└──┴──┴──────┴──────┴──────┴──────┴───────────┴────┘
```

**SubCommand Values:**

| SubCmd | Value | Config Data | Description |
|--------|-------|-------------|-------------|
| TIME | 0x0001 | 7 bytes | RTC time: [year, month, day, hour, min, sec, weekday] |
| BRIGHTNESS | 0x0002 | 1 byte | Screen brightness: 0-100% |
| SOUND | 0x0003 | 1 byte | Sound: 0=OFF, 1=ON |

**Response:** ACK or NACK

---

## 5. Communication Flow Examples

### 5.1 Host-Initiated Firmware Update Flow

```
Host                           MCU
  |                             |
  |------ HELLO --------------->|
  |<----- Status Data ----------|
  |                             |
  |-- FW_UPDATE_START --------->|
  |   (200KB, CRC32)            |
  |                             | (Show confirmation GUI)
  |<----- ACK ------------------|
  |                             |
  |-- FW_UPDATE_DATA (SeqNo=0)->|
  |<----- ACK ------------------|
  |                             |
  |-- FW_UPDATE_DATA (SeqNo=N)->|
  |<----- ACK ------------------|
  |                             |
  ... (repeat ~98 times) ...
  |                             |
  |-- FW_UPDATE_END ----------->|
  |                             | (Verify CRC32)
  |<----- ACK (Result=0x00) ----|
  |                             |
  |-- RESET (FW_UPDATE) ------->|
  |<----- ACK ------------------|
  |                             | (Reboot)
  |                             |
  |------ HELLO --------------->|
  |<----- Status Data ----------|
```

### 5.2 Device-Initiated Firmware Update Flow

```
Host                           MCU
  |                             |
  |                             | (User selects FW update in GUI)
  |<-- FW_UPDATE_REQUEST -------|
  |   (Current version: 0.1.4a) |
  |                             | (Host checks online)
  |-- FW_UPDATE_START --------->| (Update available)
  |   (200KB, CRC32)            |
  |<----- ACK ------------------|
  |                             |
  |-- FW_UPDATE_DATA (SeqNo=0)->|
  |<----- ACK ------------------|
  |                             |
  ... (transfer continues) ...
  |                             |
  
Alternative: No update available
  |<-- FW_UPDATE_REQUEST -------|
  |   (Current version: 0.1.5a) |
  |-- FW_NO_UPDATE_AVAILABLE -->| (Already latest)
  |                             | (Device exits FW update mode)
```

### 5.3 Status Query Flow

```
Host                           MCU
  |                             |
  |------ GET_STATUS ---------->|
  |<----- Status Data ----------|
  |                             |
```

### 5.4 Diagnostics Query Flow

```
Host                           MCU
  |                             |
  |------ GET_DIAGNOSTICS ----->|
  |<----- Diagnostics Data -----|
  |                             |
```

### 5.5 Firmware Version Query Flow

```
Host                           MCU
  |                             |
  |------ GET_FW_VERSION ------>|
  |<----- FW Version Data ------|
  |                             |
```


---

## 6. CRC-16-CCITT Implementation

### Algorithm Specification
- **Polynomial**: 0x1021
- **Initial Value**: 0xFFFF
- **Final XOR**: 0x0000
- **Calculation Range**: Length field through Data field (excluding Preamble and CRC16 itself)

### C Implementation
```c
uint16_t gcp_crc16(const uint8_t *data, uint16_t length) {
    uint16_t crc = 0xFFFF;
    
    for (uint16_t i = 0; i < length; i++) {
        crc ^= (uint16_t)data[i] << 8;
        
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    
    return crc;
}
```

### Rust Implementation
```rust
pub fn gcp_crc16(data: &[u8]) -> u16 {
    let mut crc: u16 = 0xFFFF;
    
    for &byte in data {
        crc ^= (byte as u16) << 8;
        
        for _ in 0..8 {
            if crc & 0x8000 != 0 {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    
    crc
}
```

---

## 7. CRC-32 Implementation (for Firmware Verification)

### Algorithm Specification
- **Polynomial**: 0x04C11DB7 (IEEE 802.3)
- **Initial Value**: 0xFFFFFFFF
- **Final XOR**: 0xFFFFFFFF
- **Used For**: Firmware integrity verification

### C Implementation
```c
uint32_t gcp_crc32(const uint8_t *data, uint32_t length) {
    uint32_t crc = 0xFFFFFFFF;
    
    for (uint32_t i = 0; i < length; i++) {
        crc ^= data[i];
        
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >> 1) ^ 0xEDB88320;  // Reversed polynomial
            } else {
                crc >>= 1;
            }
        }
    }
    
    return crc ^ 0xFFFFFFFF;
}
```

---

## 8. Timing and Buffer Specifications

### UART Settings
- **Baud Rate**: 115200 bps
- **Data Bits**: 8
- **Parity**: None
- **Stop Bits**: 1
- **Flow Control**: RTS/CTS enabled

### Buffer Sizes
- **Host TX Buffer**: Unlimited (file-based)
- **Host RX Buffer**: 4095 bytes (DMA)
- **MCU RX Buffer**: 2048 bytes (confirmed in uart.c)
- **MCU TX Buffer**: 256 bytes (TX buffer in uart.c)

### Timing Parameters
- **ACK Timeout**: 1 second
- **Maximum Retries**: 3 attempts
- **Chunk Size**: 2036 bytes recommended
- **200KB FW Transfer Time**: ~30-35 seconds estimated

### MRAM Write Performance
- **SPI Speed**: 8 MHz
- **Write Speed**: ~1 MB/s theoretical
- **2048 byte chunk**: ~2ms write time
- **200KB total**: ~0.6-1.0 seconds for MRAM writes

---

## 9. Error Handling

### Retry Strategy
1. On NACK or timeout, retry up to 3 times
2. After 3 failures, abort operation
3. Send appropriate error to user

### Common Error Scenarios

| Scenario | Error Code | Recovery Action |
|----------|------------|-----------------|
| CRC mismatch | GCP_ERROR_CRC | Retry frame transmission |
| Sequence error | GCP_ERROR_SEQ | Resend from last ACK'd sequence |
| MRAM write failure | GCP_ERROR_MRAM | Abort update, report error |
| Timeout | GCP_ERROR_TIMEOUT | Retry communication |
| Buffer overflow | GCP_ERROR_SIZE | Reduce chunk size |

---

## 10. Implementation Notes

### MCU (C) Implementation
- Use interrupt-driven UART RX
- Use DMA for UART TX
- Implement state machine for frame reception
- Write directly to MRAM during FW update
- Calculate running CRC32 during reception

### Host (Rust) Implementation
- Use `serialport` crate for UART
- Implement timeout handling
- Progress reporting for large transfers
- File I/O for firmware binaries
- Command-line or GUI interface

### Security Considerations
- CRC16 for frame integrity (not cryptographically secure)
- CRC32 for firmware integrity
- Optional: Add digital signature verification
- Optional: Add encryption for sensitive data

---

## 11. Protocol Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-17 | Initial specification |
| 2.0 | 2025-10-18 | Major restructuring: Removed protocolVersion from device info; Split data into three commands (GET_STATUS, GET_DIAGNOSTICS, GET_FW_VERSION); Added device-initiated firmware updates (FW_UPDATE_REQUEST, FW_NO_UPDATE_AVAILABLE); Enhanced firmware version with 3-character suffix; Removed unnecessary USB/charging fields; Updated structures to match Kairo hwstatus implementation; HELLO now returns status data directly |
| 2.1 | 2025-10-22 | Fixed byte length inconsistencies: Corrected GET_STATUS response to 15 bytes status data (not 21 bytes) to match actual gcp_status_data_t typedef structure; Updated frame size calculations and specification diagrams to be consistent with implementation |

---

## Appendix A: Frame Size Reference

| Command | Direction | Request Size | Response Size | Notes |
|---------|-----------|--------------|---------------|-------|
| HELLO | H→M | 10B | 25B | Status data 15B |
| GET_STATUS | H→M | 10B | 25B | Status data 15B |
| GET_DIAGNOSTICS | H→M | 10B | 46B | Diagnostics data 32B |
| GET_FW_VERSION | H→M | 10B | 16B | FW version 6B |
| SET_CONFIG(TIME) | H→M | 21B | 12B | ACK |
| FW_UPDATE_REQUEST | M→H | 14B | - | Device-initiated |
| FW_NO_UPDATE_AVAILABLE | H→M | 10B | - | No update response |
| FW_UPDATE_START | H→M | 22B | 12B | ACK |
| FW_UPDATE_DATA | H→M | 20+dataB | 12B | ACK with SeqNo |
| FW_UPDATE_END | H→M | 10B | 18B | ACK with result |
| RESET | H→M | 10B | 12B | ACK then reboot |

**Note:** Sizes include Preamble(2) + Frame + CRC16(2)

---

## Appendix B: Example Frame Encoding

### HELLO Request
```
Hex: AA 55 06 00 01 00 00 00 [CRC16]
     ├──┤ └──┘ └──┘ └──┘
     Pre  Len  Type Resv

Binary breakdown:
  Preamble: 0xAA 0x55
  Length:   0x0006 (little-endian: 06 00)
  MsgType:  0x0001 (little-endian: 01 00)
  Reserved: 0x0000 (little-endian: 00 00)
  CRC16:    Calculated over bytes [06 00 01 00 00 00]
```

### GET_STATUS Request
```
Hex: AA 55 06 00 01 20 00 00 [CRC16]
     ├──┤ └──┘ └──┘ └──┘
     Pre  Len  Type Resv

Binary breakdown:
  Preamble: 0xAA 0x55
  Length:   0x0006 (little-endian: 06 00)
  MsgType:  0x2001 (little-endian: 01 20)
  Reserved: 0x0000 (little-endian: 00 00)
  CRC16:    Calculated over bytes [06 00 01 20 00 00]
```

---

## Appendix C: Testing Checklist

### Basic Communication
- [ ] HELLO handshake
- [ ] ACK/NACK handling
- [ ] CRC verification
- [ ] Timeout handling
- [ ] Retry logic

### Firmware Update
- [ ] Small file transfer (< 10KB)
- [ ] Large file transfer (200KB)
- [ ] CRC32 verification
- [ ] Sequence number validation
- [ ] MRAM write verification
- [ ] Update application and reboot
- [ ] Power failure recovery

### State Management
- [ ] GET_STATUS all fields
- [ ] GET_DIAGNOSTICS all counters
- [ ] GET_FW_VERSION
- [ ] SET_CONFIG TIME
- [ ] SET_CONFIG other parameters


### Error Conditions
- [ ] Invalid CRC16
- [ ] Invalid CRC32
- [ ] Sequence number errors
- [ ] Buffer overflow
- [ ] MRAM write failure
- [ ] Unknown commands

---

**End of Specification**
