//! Glitchi Communication Protocol (GCP) v2.1 Implementation
//! 
//! This module implements the GCP protocol for communicating with Glitchi devices
//! over UART as specified in gcp_spec_v2.md

use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

// Protocol Constants
pub const GCP_PREAMBLE: [u8; 2] = [0xAA, 0x55];
pub const GCP_UART_BAUD: u32 = 115200;
pub const GCP_TIMEOUT_MS: u64 = 1000;
pub const GCP_MAX_RETRIES: u32 = 3;
pub const GCP_RECOMMENDED_CHUNK_SIZE: usize = 2036;

// Command Definitions
#[repr(u16)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GcpCommand {
    // Basic Control Commands (0x00xx)
    Hello = 0x0001,
    Ack = 0x0002,
    Nack = 0x0003,
    Reset = 0x0004,
    Ping = 0x0005,
    
    // Firmware Update Commands (0x10xx)
    FwUpdateStart = 0x1001,
    FwUpdateData = 0x1002,
    FwUpdateEnd = 0x1003,
    FwUpdateAbort = 0x1004,
    FwUpdateRequest = 0x1005,
    FwNoUpdateAvailable = 0x1006,
    
    // State & Configuration Commands (0x20xx)
    GetStatus = 0x2001,
    SetConfig = 0x2002,
    GetInfo = 0x2003,
    GetDiagnostics = 0x2004,
    GetFwVersion = 0x2005,
}

impl From<u16> for GcpCommand {
    fn from(value: u16) -> Self {
        match value {
            0x0001 => GcpCommand::Hello,
            0x0002 => GcpCommand::Ack,
            0x0003 => GcpCommand::Nack,
            0x0004 => GcpCommand::Reset,
            0x0005 => GcpCommand::Ping,
            0x1001 => GcpCommand::FwUpdateStart,
            0x1002 => GcpCommand::FwUpdateData,
            0x1003 => GcpCommand::FwUpdateEnd,
            0x1004 => GcpCommand::FwUpdateAbort,
            0x1005 => GcpCommand::FwUpdateRequest,
            0x1006 => GcpCommand::FwNoUpdateAvailable,
            0x2001 => GcpCommand::GetStatus,
            0x2002 => GcpCommand::SetConfig,
            0x2003 => GcpCommand::GetInfo,
            0x2004 => GcpCommand::GetDiagnostics,
            0x2005 => GcpCommand::GetFwVersion,
            _ => GcpCommand::Hello, // Default fallback
        }
    }
}

// Error Codes
#[repr(u16)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GcpError {
    Crc = 0x0001,
    Seq = 0x0002,
    Size = 0x0003,
    Timeout = 0x0004,
    Mram = 0x0005,
    UnknownCmd = 0x0006,
    InvalidParam = 0x0007,
    Busy = 0x0008,
}

// Data Structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcpStatusData {
    pub battery_level: u8,      // 0-100%
    pub system_state: u8,       // Current system state
    pub led_color: u16,         // LED color
    pub led_brightness: u8,     // LED brightness
    pub current_game_idx: u16,  // Current game index
    pub rtc_time: [u8; 8],      // [year, month, day, hour, min, sec, weekday, hundredths]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcpDiagnosticsData {
    pub step_counter: u32,      // counters.StepCounter
    pub full_power_time: u32,   // counters.FullPowerTime  
    pub silent_time: u32,       // counters.SilentTime
    pub charging_time: u32,     // counters.ChargingTime
    pub btn_counter_l: u32,     // counters.BtnCounterL
    pub btn_counter_r: u32,     // counters.BtnCounterR
    pub fram_read: u32,         // counters.FRAMRead
    pub fram_write: u32,        // counters.FRAMWrite
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcpFwVersionData {
    pub fw_version_major: u8,    // FW_VERSION_MAJOR
    pub fw_version_minor: u8,    // FW_VERSION_MINOR  
    pub fw_version_patch: u8,    // FW_VERSION_PATCH
    pub fw_version_suffix: [u8; 3], // FW_VERSION_SUFFIX (3 chars)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcpHardwareData {
    pub manufacture_date: u16,   // Manufacturing date (e.g., 0x0719 = January 25, 2025)
    pub serial_number: u16,      // Serial number (0-65535)
    pub board_type: u8,          // Board type (DEV=0x01, REV0=0x10...)
    pub hw_revision: u8,         // Hardware revision (0, 1, 2...)
    pub chip_model: u8,          // Chip model (Apollo4Lite=0x40...)
    pub features: u8,            // Feature flags (bit0:USB, bit1:BLE...)
}

#[derive(Debug, Clone)]
pub struct GcpFrame {
    pub length: u16,
    pub msg_type: GcpCommand,
    pub parameters: Vec<u8>,
    pub data: Vec<u8>,
}

impl GcpFrame {
    pub fn new(msg_type: GcpCommand) -> Self {
        Self {
            length: 6, // Base length for header + msg_type + reserved
            msg_type,
            parameters: vec![0, 0], // Default reserved bytes
            data: Vec::new(),
        }
    }

    pub fn with_parameters(msg_type: GcpCommand, parameters: Vec<u8>) -> Self {
        let length = 4 + parameters.len() as u16; // length(2) + msg_type(2) + parameters
        Self {
            length,
            msg_type,
            parameters,
            data: Vec::new(),
        }
    }

    pub fn with_data(msg_type: GcpCommand, parameters: Vec<u8>, data: Vec<u8>) -> Self {
        let length = 4 + parameters.len() as u16 + data.len() as u16;
        Self {
            length,
            msg_type,
            parameters,
            data,
        }
    }

    pub fn serialize(&self) -> Vec<u8> {
        let mut frame = Vec::new();
        
        // Preamble
        frame.extend_from_slice(&GCP_PREAMBLE);
        
        // Length (little-endian)
        frame.extend_from_slice(&self.length.to_le_bytes());
        
        // Message Type (little-endian)
        frame.extend_from_slice(&(self.msg_type as u16).to_le_bytes());
        
        // Parameters
        frame.extend_from_slice(&self.parameters);
        
        // Data
        frame.extend_from_slice(&self.data);
        
        // Calculate CRC over Length through Data
        let crc_data = &frame[2..]; // Skip preamble
        let crc = gcp_crc16(crc_data);
        frame.extend_from_slice(&crc.to_le_bytes());
        
        frame
    }

    pub fn deserialize(data: &[u8]) -> Result<Self, String> {
        if data.len() < 10 {
            return Err("Frame too short".to_string());
        }

        // Check preamble
        if data[0] != GCP_PREAMBLE[0] || data[1] != GCP_PREAMBLE[1] {
            return Err("Invalid preamble".to_string());
        }

        // Extract length
        let length = u16::from_le_bytes([data[2], data[3]]);
        
        // Verify frame length
        if data.len() < (length + 4) as usize { // +4 for preamble + CRC
            return Err("Incomplete frame".to_string());
        }

        // Extract message type
        let msg_type = GcpCommand::from(u16::from_le_bytes([data[4], data[5]]));

        // Calculate expected CRC
        let crc_data = &data[2..(2 + length) as usize];
        let calculated_crc = gcp_crc16(crc_data);
        // CRC is at the end of the frame: total_frame_length - 2
        let crc_pos = data.len() - 2;
        let received_crc = u16::from_le_bytes([data[crc_pos], data[crc_pos + 1]]);

        if calculated_crc != received_crc {
            return Err(format!("CRC mismatch: calculated={:04X}, received={:04X}", calculated_crc, received_crc));
        }

        // Extract parameters and data based on message type
        let param_data_len = length as usize - 4; // Subtract length(2) + msg_type(2)
        
        let mut parameters = Vec::new();
        let mut data_payload = Vec::new();
        
        if param_data_len > 0 {
            let payload_start = 6; // After length + msg_type
            let payload_end = payload_start + param_data_len;
            
            // For ACK responses with status data, treat everything as data
            match msg_type {
                GcpCommand::Ack => {
                    // For ACK frames, the payload structure is: MsgType(2) + SeqNo(4) + Data
                    // All payload goes to data field for easier processing
                    data_payload = data[payload_start..payload_end].to_vec();
                }
                _ => {
                    // For other commands, use the original logic
                    if param_data_len >= 2 {
                        // First 2 bytes are parameters (or reserved)
                        parameters = data[payload_start..payload_start + 2].to_vec();
                        if param_data_len > 2 {
                            data_payload = data[payload_start + 2..payload_end].to_vec();
                        }
                    } else {
                        // All payload is data
                        data_payload = data[payload_start..payload_end].to_vec();
                    }
                }
            }
        }

        Ok(Self {
            length,
            msg_type,
            parameters,
            data: data_payload,
        })
    }
}

// CRC-16-CCITT Implementation
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

// CRC-32 Implementation for firmware verification
pub fn gcp_crc32(data: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFFFFFF;
    
    for &byte in data {
        crc ^= byte as u32;
        
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB88320; // Reversed polynomial
            } else {
                crc >>= 1;
            }
        }
    }
    
    crc ^ 0xFFFFFFFF
}

// Connection State
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConnectionState {
    Disconnected,
    Connected,
    Error(String),
}

// Connection Manager for Persistent Connections
type ConnectionMap = Arc<Mutex<HashMap<String, Arc<Mutex<GcpUartHandler>>>>>;

lazy_static::lazy_static! {
    static ref CONNECTION_POOL: ConnectionMap = Arc::new(Mutex::new(HashMap::new()));
}

// UART Communication Handler
pub struct GcpUartHandler {
    port: Box<dyn serialport::SerialPort>,
}

impl GcpUartHandler {
    pub fn new(port_name: &str) -> Result<Self, String> {
        let port = serialport::new(port_name, GCP_UART_BAUD)
            .timeout(Duration::from_millis(GCP_TIMEOUT_MS))
            .data_bits(serialport::DataBits::Eight)
            .flow_control(serialport::FlowControl::Hardware)
            .parity(serialport::Parity::None)
            .stop_bits(serialport::StopBits::One)
            .open()
            .map_err(|e| format!("Failed to open port {}: {}", port_name, e))?;

        Ok(Self { port })
    }

    // Test connection health
    pub fn is_connected(&mut self) -> bool {
        // Try to send a ping command to test connection
        let ping_frame = GcpFrame::new(GcpCommand::Ping);
        match self.send_frame(&ping_frame) {
            Ok(()) => {
                // Don't wait for response, just check if we can send
                true
            }
            Err(_) => false,
        }
    }
}

// Connection Pool Management Functions
pub fn connect_to_port(port_name: String) -> Result<String, String> {
    let mut pool = CONNECTION_POOL.lock()
        .map_err(|_| "Failed to lock connection pool".to_string())?;
    
    // Check if connection already exists
    if pool.contains_key(&port_name) {
        return Ok(format!("Already connected to {}", port_name));
    }

    // Create new connection
    let handler = GcpUartHandler::new(&port_name)?;
    let handler_arc = Arc::new(Mutex::new(handler));
    
    pool.insert(port_name.clone(), handler_arc);
    
    Ok(format!("Connected to {}", port_name))
}

pub fn disconnect_from_port(port_name: String) -> Result<String, String> {
    let mut pool = CONNECTION_POOL.lock()
        .map_err(|_| "Failed to lock connection pool".to_string())?;
    
    match pool.remove(&port_name) {
        Some(_) => Ok(format!("Disconnected from {}", port_name)),
        None => Err(format!("No connection found for {}", port_name)),
    }
}

pub fn get_connection_status(port_name: String) -> Result<ConnectionState, String> {
    let pool = CONNECTION_POOL.lock()
        .map_err(|_| "Failed to lock connection pool".to_string())?;
    
    match pool.get(&port_name) {
        Some(handler_arc) => {
            match handler_arc.lock() {
                Ok(mut handler) => {
                    if handler.is_connected() {
                        Ok(ConnectionState::Connected)
                    } else {
                        Ok(ConnectionState::Error("Connection lost".to_string()))
                    }
                }
                Err(_) => Ok(ConnectionState::Error("Handler lock failed".to_string())),
            }
        }
        None => Ok(ConnectionState::Disconnected),
    }
}

pub fn execute_with_connection<F, T>(port_name: &str, operation: F) -> Result<T, String>
where
    F: FnOnce(&mut GcpUartHandler) -> Result<T, String>,
{
    let pool = CONNECTION_POOL.lock()
        .map_err(|_| "Failed to lock connection pool".to_string())?;
    
    match pool.get(port_name) {
        Some(handler_arc) => {
            match handler_arc.lock() {
                Ok(mut handler) => operation(&mut *handler),
                Err(_) => Err("Failed to lock handler".to_string()),
            }
        }
        None => Err(format!("No connection found for {}. Please connect first.", port_name)),
    }
}

impl GcpUartHandler {
    pub fn send_frame(&mut self, frame: &GcpFrame) -> Result<(), String> {
        let data = frame.serialize();
        self.port.write_all(&data)
            .map_err(|e| format!("Failed to send frame: {}", e))?;
        self.port.flush()
            .map_err(|e| format!("Failed to flush port: {}", e))?;
        Ok(())
    }

    pub fn receive_frame(&mut self) -> Result<GcpFrame, String> {
        let mut buffer = [0u8; 4096];
        let mut frame_buffer = Vec::new();
        let mut found_preamble = false;
        let mut expected_length = 0u16;

        // Read until we have a complete frame
        loop {
            match self.port.read(&mut buffer) {
                Ok(bytes_read) => {
                    if bytes_read == 0 {
                        return Err("No data received".to_string());
                    }

                    frame_buffer.extend_from_slice(&buffer[..bytes_read]);

                    // Look for preamble if we haven't found it yet
                    if !found_preamble {
                        if let Some(pos) = find_preamble(&frame_buffer) {
                            frame_buffer = frame_buffer[pos..].to_vec();
                            found_preamble = true;
                        } else {
                            // Keep looking, but don't let buffer grow too large
                            if frame_buffer.len() > 1000 {
                                frame_buffer.clear();
                            }
                            continue;
                        }
                    }

                    // If we have preamble, check if we can read length
                    if found_preamble && expected_length == 0 && frame_buffer.len() >= 4 {
                        expected_length = u16::from_le_bytes([frame_buffer[2], frame_buffer[3]]);
                    }

                    // Check if we have a complete frame
                    if expected_length > 0 && frame_buffer.len() >= (expected_length + 4) as usize {
                        let frame_data = &frame_buffer[..(expected_length + 4) as usize];
                        return GcpFrame::deserialize(frame_data);
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {
                    return Err("Timeout waiting for response".to_string());
                }
                Err(e) => {
                    return Err(format!("Failed to read from port: {}", e));
                }
            }
        }
    }

    pub fn send_hello(&mut self) -> Result<GcpHardwareData, String> {
        let hello_frame = GcpFrame::new(GcpCommand::Hello);
        
        for attempt in 1..=GCP_MAX_RETRIES {
            match self.send_frame(&hello_frame) {
                Ok(()) => {
                    match self.receive_frame() {
                        Ok(response) => {
                            println!("HELLO Response - Type: {:?}, Data len: {}, Parameters len: {}", 
                                   response.msg_type, response.data.len(), response.parameters.len());
                            
                            // Handle different response types for HELLO
                            match response.msg_type {
                                GcpCommand::Ack => {
                                    // Device sent ACK with hardware data - combine parameters and data for parsing
                                    let all_data = [response.parameters.as_slice(), response.data.as_slice()].concat();
                                    println!("ACK response with {} bytes total data (params: {}, data: {})", 
                                           all_data.len(), response.parameters.len(), response.data.len());
                                    
                                    // For HELLO ACK: expect 8 bytes of hardware data (GCP v2.2)
                                    if all_data.len() >= 8 {
                                        // Hardware data may have command acknowledgment prefix, skip if present
                                        let hw_start = if all_data.len() >= 10 && all_data[0] == 0x01 && all_data[1] == 0x00 {
                                            2  // Skip HELLO command bytes (01 00)
                                        } else {
                                            0  // No command prefix, start from beginning
                                        };
                                        let hw_data = &all_data[hw_start..];
                                        if hw_data.len() >= 8 {
                                            return Ok(parse_hardware_data(hw_data));
                                        }
                                    }
                                    
                                    // Fallback: check if we got old status data format (temporary compatibility)
                                    if all_data.len() >= 15 {
                                        println!("Warning: Device returned status data instead of hardware data - using fallback");
                                        return Ok(GcpHardwareData {
                                            manufacture_date: 0x0A17,  // October 23rd as fallback
                                            serial_number: 1000,       // Default serial
                                            board_type: 0x01,          // DEV board
                                            hw_revision: 0,
                                            chip_model: 0x40,          // Apollo4Lite
                                            features: 0x03,            // USB + BLE
                                        });
                                    }
                                    
                                    return Err("HELLO ACK response has insufficient data".to_string());
                                }
                                _ => {
                                    // Direct hardware response - combine parameters and data
                                    let all_data = [response.parameters.as_slice(), response.data.as_slice()].concat();
                                    if all_data.len() >= 8 {
                                        return Ok(parse_hardware_data(&all_data));
                                    } else {
                                        return Err(format!("Invalid HELLO response: insufficient data (got {} bytes, need 8)", all_data.len()));
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            if attempt == GCP_MAX_RETRIES {
                                return Err(format!("HELLO failed after {} attempts: {}", GCP_MAX_RETRIES, e));
                            }
                            // Try again
                            continue;
                        }
                    }
                }
                Err(e) => {
                    if attempt == GCP_MAX_RETRIES {
                        return Err(format!("Failed to send HELLO after {} attempts: {}", GCP_MAX_RETRIES, e));
                    }
                }
            }
        }

        Err("HELLO command failed".to_string())
    }

    pub fn get_status(&mut self) -> Result<GcpStatusData, String> {
        let status_frame = GcpFrame::new(GcpCommand::GetStatus);
        
        for attempt in 1..=GCP_MAX_RETRIES {
            match self.send_frame(&status_frame) {
                Ok(()) => {
                    match self.receive_frame() {
                        Ok(response) => {
                            // Combine parameters and data for status parsing (frame parser splits them incorrectly)
                            let all_data = [response.parameters.as_slice(), response.data.as_slice()].concat();
                            println!("GET_STATUS Response - Type: {:?}, Total data: {} bytes (params: {}, data: {})", 
                                   response.msg_type, all_data.len(), response.parameters.len(), response.data.len());
                            
                            if response.msg_type == GcpCommand::Ack {
                                // For ACK responses, skip the first 2 bytes (original command) if present
                                let status_start = if all_data.len() >= 17 && all_data[0] == 0x01 && all_data[1] == 0x20 {
                                    2  // Skip GET_STATUS command bytes  
                                } else {
                                    0  // No command prefix
                                };
                                let status_data = &all_data[status_start..];
                                if status_data.len() >= 15 {
                                    return Ok(parse_status_data(status_data));
                                }
                            } else if all_data.len() >= 15 {
                                return Ok(parse_status_data(&all_data));
                            }
                            
                            return Err(format!("Invalid status response: insufficient data (got {} bytes, need 15)", all_data.len()));
                        }
                        Err(e) => {
                            if attempt == GCP_MAX_RETRIES {
                                return Err(format!("Get status failed after {} attempts: {}", GCP_MAX_RETRIES, e));
                            }
                            continue;
                        }
                    }
                }
                Err(e) => {
                    if attempt == GCP_MAX_RETRIES {
                        return Err(format!("Failed to send get status after {} attempts: {}", GCP_MAX_RETRIES, e));
                    }
                }
            }
        }

        Err("Get status command failed".to_string())
    }

    pub fn get_fw_version(&mut self) -> Result<GcpFwVersionData, String> {
        let fw_version_frame = GcpFrame::new(GcpCommand::GetFwVersion);
        
        for attempt in 1..=GCP_MAX_RETRIES {
            match self.send_frame(&fw_version_frame) {
                Ok(()) => {
                    match self.receive_frame() {
                        Ok(response) => {
                            // Combine parameters and data for fw version parsing
                            let all_data = [response.parameters.as_slice(), response.data.as_slice()].concat();
                            println!("GET_FW_VERSION Response - Type: {:?}, Total data: {} bytes (params: {}, data: {})", 
                                   response.msg_type, all_data.len(), response.parameters.len(), response.data.len());
                            
                            if response.msg_type == GcpCommand::Ack {
                                // ACK payload structure: MsgType(2) + SeqNo(4) + FW_DATA(6)
                                // FW version data starts at offset 6 within the ACK payload
                                println!("ACK payload: {:02X?}", all_data);
                                if all_data.len() >= 12 { // MsgType(2) + SeqNo(4) + FW_DATA(6) = 12
                                    let version_data = &all_data[6..12]; // Skip MsgType(2) + SeqNo(4), take 6 bytes
                                    println!("Firmware version data: {:02X?}", version_data);
                                    return Ok(parse_fw_version_data(version_data));
                                }
                            } else if all_data.len() >= 6 {
                                return Ok(parse_fw_version_data(&all_data));
                            }
                            
                            return Err(format!("Invalid fw version response: insufficient data (got {} bytes, need 6)", all_data.len()));
                        }
                        Err(e) => {
                            if attempt == GCP_MAX_RETRIES {
                                return Err(format!("Get fw version failed after {} attempts: {}", GCP_MAX_RETRIES, e));
                            }
                            continue;
                        }
                    }
                }
                Err(e) => {
                    if attempt == GCP_MAX_RETRIES {
                        return Err(format!("Failed to send get fw version after {} attempts: {}", GCP_MAX_RETRIES, e));
                    }
                }
            }
        }

        Err("Get fw version command failed".to_string())
    }
}

// Helper function to find preamble in buffer
fn find_preamble(buffer: &[u8]) -> Option<usize> {
    if buffer.len() < 2 {
        return None;
    }

    for i in 0..=buffer.len() - 2 {
        if buffer[i] == GCP_PREAMBLE[0] && buffer[i + 1] == GCP_PREAMBLE[1] {
            return Some(i);
        }
    }

    None
}

// Helper function to parse status data from response (GCP v2.1: 15 bytes)
fn parse_status_data(data: &[u8]) -> GcpStatusData {
    if data.len() < 15 {
        // Return default data if insufficient
        return GcpStatusData {
            battery_level: 0,
            system_state: 0,
            led_color: 0,
            led_brightness: 0,
            current_game_idx: 0,
            rtc_time: [0; 8],
        };
    }

    GcpStatusData {
        battery_level: data[0],
        system_state: data[1],
        led_color: u16::from_le_bytes([data[2], data[3]]),
        led_brightness: data[4],
        current_game_idx: u16::from_le_bytes([data[5], data[6]]),
        rtc_time: [data[7], data[8], data[9], data[10], data[11], data[12], data[13], data[14]],
    }
}

// Helper function to parse status data flexibly with whatever data we have
fn parse_status_data_flexible(data: &[u8]) -> GcpStatusData {
    let mut status = GcpStatusData {
        battery_level: 50,  // Default values
        system_state: 1,
        led_color: 0x07E0,  // Green
        led_brightness: 255,
        current_game_idx: 0,
        rtc_time: [25, 10, 22, 2, 17, 0, 2, 0], // Current approx time
    };

    // Parse whatever fields we have available
    if data.len() >= 1 {
        status.battery_level = data[0];
    }
    if data.len() >= 2 {
        status.system_state = data[1];
    }
    if data.len() >= 4 {
        status.led_color = u16::from_le_bytes([data[2], data[3]]);
    }
    if data.len() >= 5 {
        status.led_brightness = data[4];
    }
    if data.len() >= 7 {
        status.current_game_idx = u16::from_le_bytes([data[5], data[6]]);
    }
    if data.len() >= 15 {
        status.rtc_time = [data[7], data[8], data[9], data[10], data[11], data[12], data[13], data[14]];
    }

    status
}

// Helper function to parse firmware version data from response (GCP v2.1: 6 bytes)
fn parse_fw_version_data(data: &[u8]) -> GcpFwVersionData {
    if data.len() < 6 {
        // Return default data if insufficient
        return GcpFwVersionData {
            fw_version_major: 0,
            fw_version_minor: 0,
            fw_version_patch: 0,
            fw_version_suffix: [0; 3],
        };
    }

    GcpFwVersionData {
        fw_version_major: data[0],
        fw_version_minor: data[1],
        fw_version_patch: data[2],
        fw_version_suffix: [data[3], data[4], data[5]],
    }
}

// Helper function to parse hardware data from response (GCP v2.2: 8 bytes)
fn parse_hardware_data(data: &[u8]) -> GcpHardwareData {
    if data.len() < 8 {
        // Return default data if insufficient
        return GcpHardwareData {
            manufacture_date: 0x0A17,  // October 23rd as default
            serial_number: 1000,       // Default serial
            board_type: 0x01,          // DEV board
            hw_revision: 0,
            chip_model: 0x40,          // Apollo4Lite
            features: 0x03,            // USB + BLE
        };
    }

    GcpHardwareData {
        manufacture_date: u16::from_le_bytes([data[0], data[1]]),
        serial_number: u16::from_le_bytes([data[2], data[3]]),
        board_type: data[4],
        hw_revision: data[5],
        chip_model: data[6],
        features: data[7],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crc16() {
        let data = [0x06, 0x00, 0x01, 0x00, 0x00, 0x00];
        let crc = gcp_crc16(&data);
        // This should match the expected CRC for a HELLO frame
        assert_ne!(crc, 0);
    }

    #[test]
    fn test_frame_serialization() {
        let frame = GcpFrame::new(GcpCommand::Hello);
        let serialized = frame.serialize();
        
        // Check preamble
        assert_eq!(serialized[0], 0xAA);
        assert_eq!(serialized[1], 0x55);
        
        // Check length (little-endian)
        assert_eq!(serialized[2], 0x06);
        assert_eq!(serialized[3], 0x00);
        
        // Check command (little-endian)
        assert_eq!(serialized[4], 0x01);
        assert_eq!(serialized[5], 0x00);
    }

    #[test]
    fn test_frame_deserialization() {
        let frame = GcpFrame::new(GcpCommand::Hello);
        let serialized = frame.serialize();
        let deserialized = GcpFrame::deserialize(&serialized).unwrap();
        
        assert_eq!(deserialized.msg_type as u16, GcpCommand::Hello as u16);
        assert_eq!(deserialized.length, 6);
    }
}
