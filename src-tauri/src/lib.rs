// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use serialport::{SerialPortInfo, SerialPortType};
use tauri::Emitter;

mod gcp;
use gcp::{GcpStatusData, GcpFwVersionData, GcpHardwareData, ConnectionState, connect_to_port, disconnect_from_port, get_connection_status, execute_with_connection, GCP_RECOMMENDED_CHUNK_SIZE, gcp_crc32};

#[derive(Debug, Serialize, Deserialize)]
pub struct COMPortInfo {
    pub port: String,
    pub description: String,
    pub manufacturer: Option<String>,
    pub serial_number: Option<String>,
    pub vendor_id: Option<u16>,
    pub product_id: Option<u16>,
    pub port_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FirmwareUpdateProgress {
    pub stage: String,
    pub current_chunk: u32,
    pub total_chunks: u32,
    pub bytes_sent: u32,
    pub total_bytes: u32,
    pub percentage: f64,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FirmwareUpdateResult {
    pub success: bool,
    pub message: String,
    pub crc32_match: bool,
    pub total_chunks: u32,
    pub total_bytes: u32,
}

#[tauri::command]
fn list_com_ports() -> Result<Vec<COMPortInfo>, String> {
    match serialport::available_ports() {
        Ok(ports) => {
            let port_info: Vec<COMPortInfo> = ports
                .into_iter()
                .map(|port| COMPortInfo {
                    port: port.port_name.clone(),
                    description: format_port_description(&port),
                    manufacturer: extract_manufacturer(&port.port_type),
                    serial_number: extract_serial_number(&port.port_type),
                    vendor_id: extract_vendor_id(&port.port_type),
                    product_id: extract_product_id(&port.port_type),
                    port_type: format_port_type(&port.port_type),
                })
                .collect();
            Ok(port_info)
        }
        Err(e) => Err(format!("Failed to list COM ports: {}", e)),
    }
}

#[tauri::command]
fn get_port_info(port_name: String) -> Result<Option<COMPortInfo>, String> {
    match serialport::available_ports() {
        Ok(ports) => {
            let port_info = ports
                .into_iter()
                .find(|port| port.port_name == port_name)
                .map(|port| COMPortInfo {
                    port: port.port_name.clone(),
                    description: format_port_description(&port),
                    manufacturer: extract_manufacturer(&port.port_type),
                    serial_number: extract_serial_number(&port.port_type),
                    vendor_id: extract_vendor_id(&port.port_type),
                    product_id: extract_product_id(&port.port_type),
                    port_type: format_port_type(&port.port_type),
                });
            Ok(port_info)
        }
        Err(e) => Err(format!("Failed to get port info: {}", e)),
    }
}

fn format_port_description(port: &SerialPortInfo) -> String {
    match &port.port_type {
        SerialPortType::UsbPort(info) => {
            if let Some(product) = &info.product {
                format!("{} ({})", product, port.port_name)
            } else {
                format!("USB Serial Port ({})", port.port_name)
            }
        }
        SerialPortType::BluetoothPort => format!("Bluetooth Serial Port ({})", port.port_name),
        SerialPortType::PciPort => format!("PCI Serial Port ({})", port.port_name),
        SerialPortType::Unknown => format!("Serial Port ({})", port.port_name),
    }
}

fn extract_manufacturer(port_type: &SerialPortType) -> Option<String> {
    match port_type {
        SerialPortType::UsbPort(info) => info.manufacturer.clone(),
        _ => None,
    }
}

fn extract_serial_number(port_type: &SerialPortType) -> Option<String> {
    match port_type {
        SerialPortType::UsbPort(info) => info.serial_number.clone(),
        _ => None,
    }
}

fn extract_vendor_id(port_type: &SerialPortType) -> Option<u16> {
    match port_type {
        SerialPortType::UsbPort(info) => Some(info.vid),
        _ => None,
    }
}

fn extract_product_id(port_type: &SerialPortType) -> Option<u16> {
    match port_type {
        SerialPortType::UsbPort(info) => Some(info.pid),
        _ => None,
    }
}

fn format_port_type(port_type: &SerialPortType) -> String {
    match port_type {
        SerialPortType::UsbPort(_) => "USB".to_string(),
        SerialPortType::BluetoothPort => "Bluetooth".to_string(),
        SerialPortType::PciPort => "PCI".to_string(),
        SerialPortType::Unknown => "Unknown".to_string(),
    }
}

// Connection Management Commands
#[tauri::command]
fn connect_port(port_name: String) -> Result<String, String> {
    connect_to_port(port_name)
}

#[tauri::command]
fn disconnect_port(port_name: String) -> Result<String, String> {
    disconnect_from_port(port_name)
}

#[tauri::command]
fn get_port_connection_status(port_name: String) -> Result<String, String> {
    match get_connection_status(port_name)? {
        ConnectionState::Connected => Ok("Connected".to_string()),
        ConnectionState::Disconnected => Ok("Disconnected".to_string()),
        ConnectionState::Error(msg) => Ok(format!("Error: {}", msg)),
    }
}

// GCP Commands using persistent connections
#[tauri::command]
fn gcp_send_hello(port_name: String) -> Result<GcpHardwareData, String> {
    execute_with_connection(&port_name, |handler| handler.send_hello())
}

#[tauri::command]
fn gcp_get_status(port_name: String) -> Result<GcpStatusData, String> {
    execute_with_connection(&port_name, |handler| handler.get_status())
}

#[tauri::command]
fn gcp_get_fw_version(port_name: String) -> Result<GcpFwVersionData, String> {
    execute_with_connection(&port_name, |handler| handler.get_fw_version())
}

// Firmware Update Commands
#[tauri::command]
async fn gcp_firmware_update(
    port_name: String, 
    file_path: String, 
    window: tauri::Window
) -> Result<FirmwareUpdateResult, String> {
    use std::time::Instant;
    
    // Read firmware file
    let firmware_data = match fs::read(&file_path) {
        Ok(data) => data,
        Err(e) => return Err(format!("Failed to read firmware file: {}", e))
    };

    let total_bytes = firmware_data.len() as u32;
    let chunk_size = GCP_RECOMMENDED_CHUNK_SIZE;
    let total_chunks = ((total_bytes as usize + chunk_size - 1) / chunk_size) as u32;
    let firmware_crc32 = gcp_crc32(&firmware_data);

    println!("Starting firmware update: {} bytes, {} chunks, CRC32: {:08X}", 
           total_bytes, total_chunks, firmware_crc32);

    // Helper function to emit progress
    let emit_progress = |stage: &str, current: u32, status: &str, bytes_sent: u32| {
        let progress = FirmwareUpdateProgress {
            stage: stage.to_string(),
            current_chunk: current,
            total_chunks,
            bytes_sent,
            total_bytes,
            percentage: (bytes_sent as f64 / total_bytes as f64) * 100.0,
            status: status.to_string(),
        };
        let _ = window.emit("firmware-progress", &progress);
    };

    // Execute the firmware update with the connection
    let result = execute_with_connection(&port_name, |handler| {
        let start_time = Instant::now();

        // Stage 1: Start firmware update
        emit_progress("Initiating", 0, "Sending firmware update start command...", 0);
        
        match handler.start_firmware_update(&firmware_data, chunk_size as u16) {
            Ok(()) => {
                emit_progress("Initiated", 0, "Device acknowledged firmware update start", 0);
            }
            Err(e) => {
                return Err(format!("Failed to start firmware update: {}", e));
            }
        }

        // Stage 2: Send firmware chunks
        emit_progress("Transferring", 0, "Starting firmware data transfer...", 0);
        
        let mut bytes_sent = 0u32;
        
        for chunk_index in 0..total_chunks {
            let chunk_start = (chunk_index as usize) * chunk_size;
            let chunk_end = std::cmp::min(chunk_start + chunk_size, firmware_data.len());
            let chunk_data = &firmware_data[chunk_start..chunk_end];
            
            let status_msg = format!("Sending chunk {} of {} ({} bytes)", 
                                   chunk_index + 1, total_chunks, chunk_data.len());
            emit_progress("Transferring", chunk_index + 1, &status_msg, bytes_sent);

            match handler.send_firmware_chunk(chunk_data, chunk_start as u32) {
                Ok(()) => {
                    bytes_sent += chunk_data.len() as u32;
                    
                    // Emit progress every few chunks or at the end
                    if chunk_index % 5 == 0 || chunk_index == total_chunks - 1 {
                        let progress_msg = format!("Sent chunk {} of {} ({:.1}%)", 
                                                 chunk_index + 1, total_chunks,
                                                 (bytes_sent as f64 / total_bytes as f64) * 100.0);
                        emit_progress("Transferring", chunk_index + 1, &progress_msg, bytes_sent);
                    }
                }
                Err(e) => {
                    let error_msg = format!("Failed to send chunk {}: {}", chunk_index, e);
                    emit_progress("Error", chunk_index, &error_msg, bytes_sent);
                    return Err(error_msg);
                }
            }
        }

        // Stage 3: End firmware update and verify
        emit_progress("Verifying", total_chunks, "Requesting firmware verification...", bytes_sent);

        match handler.end_firmware_update() {
            Ok(crc_match) => {
                let elapsed = start_time.elapsed();
                let transfer_rate = (bytes_sent as f64) / elapsed.as_secs_f64();
                
                if crc_match {
                    let success_msg = format!("Firmware update completed successfully in {:.1}s ({:.1} KB/s)", 
                                             elapsed.as_secs_f64(), transfer_rate / 1024.0);
                    emit_progress("Completed", total_chunks, &success_msg, bytes_sent);
                    
                    Ok(FirmwareUpdateResult {
                        success: true,
                        message: success_msg,
                        crc32_match: true,
                        total_chunks,
                        total_bytes: bytes_sent,
                    })
                } else {
                    let error_msg = "Firmware verification failed - CRC32 mismatch".to_string();
                    emit_progress("Failed", total_chunks, &error_msg, bytes_sent);
                    
                    Ok(FirmwareUpdateResult {
                        success: false,
                        message: error_msg,
                        crc32_match: false,
                        total_chunks,
                        total_bytes: bytes_sent,
                    })
                }
            }
            Err(e) => {
                let error_msg = format!("Firmware verification failed: {}", e);
                emit_progress("Failed", total_chunks, &error_msg, bytes_sent);
                
                Err(error_msg)
            }
        }
    });

    result
}

#[tauri::command]
fn gcp_abort_firmware_update(port_name: String) -> Result<String, String> {
    execute_with_connection(&port_name, |handler| {
        handler.abort_firmware_update()?;
        Ok("Firmware update aborted".to_string())
    })
}

#[tauri::command]
fn gcp_send_firmware_chunk(port_name: String, chunk_data: Vec<u8>, sequence_number: u32) -> Result<String, String> {
    execute_with_connection(&port_name, |handler| {
        handler.send_firmware_chunk_single_try(&chunk_data, sequence_number)?;
        Ok(format!("Successfully sent {} bytes with sequence number {}", chunk_data.len(), sequence_number))
    })
}

#[tauri::command]
fn gcp_start_firmware_update(port_name: String, firmware_data: Vec<u8>, chunk_size: u16) -> Result<String, String> {
    execute_with_connection(&port_name, |handler| {
        handler.start_firmware_update(&firmware_data, chunk_size)?;
        Ok(format!("Firmware update started for {} bytes", firmware_data.len()))
    })
}

#[tauri::command]
fn gcp_reset_device(port_name: String, apply_firmware: bool) -> Result<String, String> {
    let reset_type = if apply_firmware { 0x0002 } else { 0x0001 };
    execute_with_connection(&port_name, |handler| {
        handler.reset_device(reset_type)?;
        Ok(if apply_firmware {
            "Device reset with firmware application initiated".to_string()
        } else {
            "Device software reset initiated".to_string()
        })
    })
}

// Debug command to test CRC calculations
#[tauri::command]
fn test_gcp_frame_construction() -> Result<String, String> {
    use gcp::{GcpFrame, GcpCommand, gcp_crc16};
    
    // Test a simple HELLO frame first
    let hello_frame = GcpFrame::new(GcpCommand::Hello);
    let hello_data = hello_frame.serialize();
    
    let crc_data = &hello_data[2..(2 + hello_frame.length) as usize];
    let calculated_crc = gcp_crc16(crc_data);
    
    let mut result = format!("HELLO Frame Test:\n");
    result.push_str(&format!("  Frame: {:02X?}\n", hello_data));
    result.push_str(&format!("  Length: {}\n", hello_frame.length));
    result.push_str(&format!("  CRC Data: {:02X?}\n", crc_data));
    result.push_str(&format!("  Calculated CRC: 0x{:04X}\n", calculated_crc));
    
    // Test FW_UPDATE_START frame construction
    let fw_size = 1024u32;
    let fw_crc32 = 0x12345678u32;
    let chunk_size = 2036u16;
    
    let mut parameters = Vec::new();
    parameters.extend_from_slice(&fw_size.to_le_bytes());        
    parameters.extend_from_slice(&fw_crc32.to_le_bytes());       
    parameters.extend_from_slice(&chunk_size.to_le_bytes());     
    parameters.extend_from_slice(&[0u8, 0u8]);                   
    
    let start_frame = GcpFrame::with_parameters(GcpCommand::FwUpdateStart, parameters);
    let start_data = start_frame.serialize();
    
    let start_crc_data = &start_data[2..(2 + start_frame.length) as usize];
    let start_calculated_crc = gcp_crc16(start_crc_data);
    
    result.push_str(&format!("\nFW_UPDATE_START Frame Test:\n"));
    result.push_str(&format!("  Frame: {:02X?}\n", start_data));
    result.push_str(&format!("  Length: {}\n", start_frame.length));
    result.push_str(&format!("  Parameters: {:02X?}\n", start_frame.parameters));
    result.push_str(&format!("  CRC Data: {:02X?}\n", start_crc_data));
    result.push_str(&format!("  Calculated CRC: 0x{:04X}\n", start_calculated_crc));
    result.push_str(&format!("  Expected total frame size: {} bytes\n", start_data.len()));
    
    // Verify against GCP v2.2 spec
    result.push_str(&format!("\nGCP v2.2 Spec Compliance:\n"));
    result.push_str(&format!("  Expected length: 18 (0x12)\n"));
    result.push_str(&format!("  Actual length: {} (0x{:02X})\n", start_frame.length, start_frame.length));
    result.push_str(&format!("  Parameters length: {} (should be 12)\n", start_frame.parameters.len()));
    result.push_str(&format!("  Spec match: {}\n", start_frame.length == 18 && start_frame.parameters.len() == 12));
    
    Ok(result)
}

#[tauri::command]
fn get_firmware_file_info(file_path: String) -> Result<serde_json::Value, String> {
    let path = Path::new(&file_path);
    
    // Validate file
    if let Some(extension) = path.extension() {
        if !["bin", "hex", "fw"].contains(&extension.to_str().unwrap_or("")) {
            return Err("Only .bin, .hex, and .fw files are supported".to_string());
        }
    } else {
        return Err("File must have .bin, .hex, or .fw extension".to_string());
    }

    // Read and analyze firmware file
    let firmware_data = match fs::read(&file_path) {
        Ok(data) => data,
        Err(e) => return Err(format!("Failed to read firmware file: {}", e))
    };

    let file_size = firmware_data.len();
    let crc32 = gcp_crc32(&firmware_data);
    let chunk_size = GCP_RECOMMENDED_CHUNK_SIZE;
    let estimated_chunks = (file_size + chunk_size - 1) / chunk_size;
    
    // Estimate transfer time (based on 115200 baud + protocol overhead)
    let estimated_time_seconds = (file_size as f64 * 10.0) / 115200.0 * 1.5; // 1.5x for protocol overhead
    
    let info = serde_json::json!({
        "fileName": path.file_name().and_then(|n| n.to_str()).unwrap_or("Unknown"),
        "filePath": file_path,
        "fileSize": file_size,
        "fileSizeFormatted": format_file_size(file_size),
        "crc32": format!("{:08X}", crc32),
        "estimatedChunks": estimated_chunks,
        "chunkSize": chunk_size,
        "estimatedTimeSeconds": estimated_time_seconds,
        "estimatedTimeFormatted": format_duration(estimated_time_seconds),
        "isValid": true,
        "fileType": extension_to_type(path.extension().and_then(|e| e.to_str()).unwrap_or("bin"))
    });

    Ok(info)
}

fn extension_to_type(ext: &str) -> &str {
    match ext {
        "bin" => "Binary Firmware",
        "hex" => "Intel HEX Firmware", 
        "fw" => "Firmware Image",
        _ => "Unknown Firmware"
    }
}

fn format_duration(seconds: f64) -> String {
    if seconds < 60.0 {
        format!("{:.0}s", seconds)
    } else {
        let minutes = (seconds / 60.0).floor();
        let remaining_seconds = seconds - (minutes * 60.0);
        format!("{}m {:.0}s", minutes, remaining_seconds)
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've called me from React!", name)
}

#[tauri::command]
fn calculate_progress(start: f64, end: f64, current: f64) -> f64 {
    if end <= start {
        return 0.0;
    }
    
    let progress = (current - start) / (end - start) * 100.0;
    progress.max(0.0).min(100.0)
}

#[tauri::command]
fn get_system_info() -> String {
    format!(
        "Operating System: {}\nArchitecture: {}\nRust Version: {}",
        std::env::consts::OS,
        std::env::consts::ARCH,
        "1.90.0"
    )
}

#[tauri::command]
fn process_data(data: Vec<i32>) -> Vec<i32> {
    data.iter().map(|x| x * 2).collect()
}

#[tauri::command]
fn read_bin_file(file_path: String) -> Result<Vec<u8>, String> {
    let path = Path::new(&file_path);
    
    // Check if file has .bin extension
    if let Some(extension) = path.extension() {
        if extension != "bin" {
            return Err("Only .bin files are allowed".to_string());
        }
    } else {
        return Err("File must have .bin extension".to_string());
    }

    match fs::read(&file_path) {
        Ok(data) => Ok(data),
        Err(e) => Err(format!("Failed to read .bin file: {}", e))
    }
}

#[tauri::command]
fn analyze_bin_file(file_path: String) -> Result<serde_json::Value, String> {
    let path = Path::new(&file_path);
    
    // Ensure it's a .bin file
    if let Some(extension) = path.extension() {
        if extension != "bin" {
            return Err("Only .bin files are allowed".to_string());
        }
    } else {
        return Err("File must have .bin extension".to_string());
    }

    let data = match fs::read(&file_path) {
        Ok(data) => data,
        Err(e) => return Err(format!("Failed to read .bin file: {}", e))
    };

    let metadata = match fs::metadata(&file_path) {
        Ok(meta) => meta,
        Err(e) => return Err(format!("Failed to get file metadata: {}", e))
    };

    // Analyze binary data
    let file_size = data.len();
    let mut byte_counts = [0u32; 256];
    for &byte in &data {
        byte_counts[byte as usize] += 1;
    }

    let most_common_byte = byte_counts
        .iter()
        .enumerate()
        .max_by_key(|(_, &count)| count)
        .map(|(byte, _)| byte)
        .unwrap_or(0);

    let entropy = calculate_entropy(&data);
    
    let analysis = serde_json::json!({
        "fileName": path.file_name().and_then(|n| n.to_str()).unwrap_or("Unknown"),
        "filePath": file_path,
        "fileSize": file_size,
        "fileSizeFormatted": format_file_size(file_size),
        "mostCommonByte": format!("0x{:02X} ({})", most_common_byte, most_common_byte),
        "entropy": entropy,
        "created": metadata.created().ok(),
        "modified": metadata.modified().ok(),
        "preview": get_hex_preview(&data, 16),
        "statistics": {
            "nullBytes": byte_counts[0],
            "printableChars": data.iter().filter(|&&b| b >= 32 && b <= 126).count(),
            "highBytes": data.iter().filter(|&&b| b > 127).count()
        }
    });

    Ok(analysis)
}

fn calculate_entropy(data: &[u8]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }

    let mut counts = [0u32; 256];
    for &byte in data {
        counts[byte as usize] += 1;
    }

    let length = data.len() as f64;
    let mut entropy = 0.0;

    for &count in &counts {
        if count > 0 {
            let probability = count as f64 / length;
            entropy -= probability * probability.log2();
        }
    }

    entropy
}

fn format_file_size(size: usize) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = size as f64;
    let mut unit = 0;

    while size >= 1024.0 && unit < UNITS.len() - 1 {
        size /= 1024.0;
        unit += 1;
    }

    format!("{:.2} {}", size, UNITS[unit])
}

fn get_hex_preview(data: &[u8], lines: usize) -> String {
    let bytes_per_line = 16;
    let total_bytes = std::cmp::min(data.len(), lines * bytes_per_line);
    let mut preview = String::new();

    for chunk_start in (0..total_bytes).step_by(bytes_per_line) {
        let chunk_end = std::cmp::min(chunk_start + bytes_per_line, total_bytes);
        let chunk = &data[chunk_start..chunk_end];

        // Address
        preview.push_str(&format!("{:08X}: ", chunk_start));

        // Hex bytes
        for (i, &byte) in chunk.iter().enumerate() {
            preview.push_str(&format!("{:02X} ", byte));
            if i == 7 {
                preview.push(' '); // Extra space in the middle
            }
        }

        // Padding for incomplete lines
        for _ in chunk.len()..bytes_per_line {
            preview.push_str("   ");
            if chunk.len() <= 8 {
                preview.push(' ');
            }
        }

        // ASCII representation
        preview.push_str(" |");
        for &byte in chunk {
            if byte >= 32 && byte <= 126 {
                preview.push(byte as char);
            } else {
                preview.push('.');
            }
        }
        preview.push_str("|\n");
    }

    if data.len() > total_bytes {
        preview.push_str(&format!("... ({} more bytes)\n", data.len() - total_bytes));
    }

    preview
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
        greet,
        calculate_progress,
        get_system_info,
        process_data,
        read_bin_file,
        analyze_bin_file,
        list_com_ports,
        get_port_info,
        connect_port,
        disconnect_port,
        get_port_connection_status,
        gcp_send_hello,
        gcp_get_status,
        gcp_get_fw_version,
        gcp_firmware_update,
        gcp_abort_firmware_update,
        gcp_reset_device,
        gcp_send_firmware_chunk,
        gcp_start_firmware_update,
        get_firmware_file_info,
        test_gcp_frame_construction
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
