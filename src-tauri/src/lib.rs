// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use serialport::{SerialPortInfo, SerialPortType};

mod gcp;
use gcp::{GcpUartHandler, GcpStatusData, GcpFwVersionData, GcpHardwareData, ConnectionState, connect_to_port, disconnect_from_port, get_connection_status, execute_with_connection};

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
        gcp_get_fw_version
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
