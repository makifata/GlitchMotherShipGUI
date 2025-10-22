use serialport::{available_ports, SerialPortInfo, SerialPortType};

fn main() {
    println!("🔍 Testing COM Port Discovery...\n");
    
    match available_ports() {
        Ok(ports) => {
            if ports.is_empty() {
                println!("❌ No COM ports found on this system.");
            } else {
                println!("✅ Found {} COM port(s):\n", ports.len());
                
                for (index, port) in ports.iter().enumerate() {
                    println!("--- Port {} ---", index + 1);
                    println!("Name: {}", port.port_name);
                    
                    match &port.port_type {
                        SerialPortType::UsbPort(info) => {
                            println!("Type: USB");
                            if let Some(manufacturer) = &info.manufacturer {
                                println!("Manufacturer: {}", manufacturer);
                            }
                            if let Some(product) = &info.product {
                                println!("Product: {}", product);
                            }
                            if let Some(serial) = &info.serial_number {
                                println!("Serial Number: {}", serial);
                            }
                            println!("VID: 0x{:04X}", info.vid);
                            println!("PID: 0x{:04X}", info.pid);
                        }
                        SerialPortType::BluetoothPort => {
                            println!("Type: Bluetooth");
                        }
                        SerialPortType::PciPort => {
                            println!("Type: PCI");
                        }
                        SerialPortType::Unknown => {
                            println!("Type: Unknown");
                        }
                    }
                    println!(); // Empty line between ports
                }
            }
        }
        Err(e) => {
            println!("❌ Error discovering COM ports: {}", e);
        }
    }
    
    println!("🏁 COM port discovery test complete!");
}
