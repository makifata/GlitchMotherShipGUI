# Build Instructions - Tauri + React + TypeScript Project

## 🎯 Project Overview

This project combines **React + TypeScript** frontend with **Rust** backend using **Tauri** to create a native desktop application.

---

## 📋 Prerequisites

### **Required Software**

#### **1. Node.js & npm**

- **Version**: Node.js 18+ recommended
- **Download**: https://nodejs.org/
- **Verify installation**:
  ```bash
  node --version    # Should show v18.0.0 or higher
  npm --version     # Should show 9.0.0 or higher
  ```

#### **2. Rust & Cargo**

- **Install via rustup** (recommended):

  ```bash
  # Windows
  curl -o rustup-init.exe https://win.rustup.rs/x86_64
  .\rustup-init.exe

  # macOS/Linux
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- **Verify installation**:
  ```bash
  rustc --version    # Should show 1.70+
  cargo --version    # Should show 1.70+
  ```

#### **3. Tauri CLI**

```bash
cargo install tauri-cli
```

### **Platform-Specific Requirements**

#### **Windows**

- **Visual Studio Build Tools** or **Visual Studio Community**
- **WebView2**: Usually pre-installed on Windows 11

#### **macOS**

- **Xcode Command Line Tools**: `xcode-select --install`
- **macOS 10.13+** for running the app

#### **Linux (Ubuntu/Debian)**

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

---

## 🚀 Quick Start

### **1. Clone/Download Project**

```bash
git clone [repository-url]
cd my-app
```

### **2. Install Dependencies**

```bash
# Install Node.js dependencies
npm install

# Verify Tauri CLI is installed
cargo tauri --version
```

### **3. Development Mode**

```bash
# Start development server (React + Rust hot reload)
cargo tauri dev
```

- **React dev server**: Automatically starts at http://localhost:5173
- **Rust backend**: Compiles and runs automatically
- **Desktop app window**: Opens automatically

### **4. Production Build**

```bash
# Build production application
cargo tauri build
```

---

## 📁 Project Structure

```
my-app/
├── src/                          # React Frontend
│   ├── components/
│   │   ├── ProgressBarComponent.tsx      # Pure React progress bar
│   │   └── TauriIntegrationComponent.tsx # Rust integration demo
│   ├── App.tsx                   # Main React application
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Global styles
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── main.rs              # Rust entry point
│   │   └── lib.rs               # Tauri commands definition
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri configuration
│   └── icons/                   # Application icons
├── dist/                         # Built React assets (auto-generated)
├── node_modules/                 # Node.js dependencies
├── package.json                  # Node.js configuration
└── vite.config.ts               # Vite build configuration
```

---

## 🛠️ Development Workflow

### **1. Frontend Development**

```bash
# Start React-only development server
npm run dev
# Visit: http://localhost:5173
```

### **2. Full Stack Development**

```bash
# Start complete Tauri application (React + Rust)
cargo tauri dev
```

### **3. Backend (Rust) Only Changes**

- Edit files in `src-tauri/src/`
- Tauri automatically recompiles and restarts

### **4. Frontend (React) Only Changes**

- Edit files in `src/`
- Vite automatically hot-reloads in the desktop app

---

## 📦 Build Outputs

### **Development Build** (`cargo tauri dev`)

- **Debug binary**: `src-tauri/target/debug/app.exe`
- **No bundling**: Development version only
- **Fast compilation**: Optimized for development speed

### **Production Build** (`cargo tauri build`)

#### **Windows**

```
src-tauri/target/release/bundle/
├── msi/
│   └── first_gui_example_0.1.0_x64_en-US.msi     # MSI installer
├── nsis/
│   └── first_gui_example_0.1.0_x64-setup.exe     # NSIS installer
└── ../app.exe                                     # Standalone executable
```

#### **macOS** (when built on macOS)

```
src-tauri/target/release/bundle/
├── dmg/
│   └── first_gui_example_0.1.0_x64.dmg          # DMG installer
└── macos/
    └── first_gui_example.app/                    # Application bundle
```

#### **Linux** (when built on Linux)

```
src-tauri/target/release/bundle/
├── deb/
│   └── first_gui_example_0.1.0_amd64.deb        # Debian package
├── appimage/
│   └── first_gui_example_0.1.0_amd64.AppImage   # Portable app
└── ../app                                        # Binary executable
```

---

## 🔧 Configuration Files

### **package.json**

```json
{
  "name": "my-app",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "tauri:dev": "cargo tauri dev",
    "tauri:build": "cargo tauri build"
  },
  "dependencies": {
    "react": "^18.0.0",
    "@tauri-apps/api": "^2.0.0"
  }
}
```

### **src-tauri/Cargo.toml**

```toml
[package]
name = "app"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.0", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri-plugin-log = "2.0"
```

### **src-tauri/tauri.conf.json**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "first_gui_example",
  "version": "0.1.0",
  "identifier": "com.example.react-rust-app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  }
}
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. "cargo not found"**

```bash
# Add Rust to PATH (Windows)
$env:PATH += ";$env:USERPROFILE\.cargo\bin"

# Or restart terminal after Rust installation
```

#### **2. "npm install fails"**

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
```

#### **3. "Tauri build fails"**

```bash
# Check Rust toolchain
rustup show

# Update Rust
rustup update

# Clean build artifacts
cargo clean
cd src-tauri && cargo clean
```

#### **4. "WebView2 missing" (Windows)**

- Download from: https://developer.microsoft.com/microsoft-edge/webview2/
- Or enable Windows Updates

#### **5. "Permission denied" (macOS/Linux)**

```bash
# Make sure you have correct permissions
chmod +x target/release/app
```

### **Platform-Specific Issues**

#### **Windows**

- **Visual Studio Build Tools**: Required for compilation
- **PowerShell vs Command Prompt**: Use PowerShell for better compatibility

#### **macOS**

- **Xcode**: Command Line Tools must be installed
- **Signing**: Required for distribution outside development

#### **Linux**

- **GTK dependencies**: Must install system packages
- **AppImage**: Self-contained but larger file size

---

## ⚙️ Advanced Configuration

### **Custom Build Scripts**

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "tauri:dev": "cargo tauri dev",
    "tauri:build": "cargo tauri build",
    "tauri:build:debug": "cargo tauri build --debug",
    "build:windows": "cargo tauri build --target x86_64-pc-windows-msvc",
    "build:macos": "cargo tauri build --target universal-apple-darwin",
    "build:linux": "cargo tauri build --target x86_64-unknown-linux-gnu"
  }
}
```

### **Environment Variables**

```bash
# Development
export TAURI_DEBUG=true
export RUST_LOG=debug

# Production
export TAURI_RELEASE=true
export RUST_LOG=info
```

### **Custom Icons**

Place your icons in `src-tauri/icons/`:

- `icon.png` (1024x1024)
- `icon.ico` (Windows)
- `icon.icns` (macOS)

---

## 🚀 Distribution

### **1. Standalone Executable**

- **Windows**: `app.exe` - Double-click to run
- **macOS**: `first_gui_example.app` - Drag to Applications
- **Linux**: `app` - Make executable and run

### **2. Installer Packages**

- **Windows**: `.msi` or `.exe` installers
- **macOS**: `.dmg` disk images
- **Linux**: `.deb`, `.AppImage`, or `.rpm` packages

### **3. Code Signing** (for distribution)

- **Windows**: Authenticode signing
- **macOS**: Apple Developer ID
- **Linux**: GPG signatures

---

## 📊 Performance Tips

### **Development**

- **Hot Reload**: Enabled by default in dev mode
- **Debug Symbols**: Included in debug builds
- **Fast Compilation**: Use `cargo check` for syntax checking

### **Production**

- **Optimization**: Release builds are optimized
- **Size Reduction**: Use `strip` to reduce binary size
- **Performance**: Rust backend provides near-native performance

---

## 🎉 Success Indicators

You've successfully built the project when you see:

### **Development Mode**

```
✓ VITE v7.1.9 ready in 356 ms
➜ Local: http://localhost:5173/
```

```
Finished `dev` profile [unoptimized + debuginfo] target(s) in 10.22s
Running `target\debug\app.exe`
```

### **Production Build**

```
Finished `release` profile [optimized] target(s) in 3m 28s
Built application at: C:\...\target\release\app.exe
Finished 2 bundles at:
    C:\...\first_gui_example_0.1.0_x64_en-US.msi
    C:\...\first_gui_example_0.1.0_x64-setup.exe
```

🎊 **Congratulations!** You now have a fully functional cross-platform desktop application built with React + Rust!
