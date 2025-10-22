# VS Code Keyboard Shortcuts Setup Guide

## 🎯 Manual Keyboard Shortcut Setup

Since automatic keybindings had issues, here's how to manually set up keyboard shortcuts for Tauri tasks in VS Code.

---

## 📋 Available Tasks

### **✅ Working Tasks** (confirmed via Terminal → Run Task)

1. **Tauri Dev** - Starts desktop app with React + Rust
2. **Tauri Build** - Creates production build
3. **React Dev Only** - Browser-only development
4. **Stop Tauri Dev** - Stops running Tauri app

---

## ⌨️ Manual Shortcut Setup

### **Method 1: VS Code Settings (Recommended)**

1. **Open Keyboard Shortcuts**:

   - Press `Ctrl + Shift + P`
   - Type "keyboard shortcuts"
   - Select **"Preferences: Open Keyboard Shortcuts"**

2. **Search for "Tasks: Run Task"**:

   - In the search box, type `workbench.action.tasks.runTask`
   - Click the **"+"** button to add a new keybinding

3. **Set up each shortcut**:

   #### **Tauri Dev** (Most Important)

   - **Command**: `workbench.action.tasks.runTask`
   - **Key**: `F5` (recommended - no conflicts)
   - **When**: (leave empty)
   - **Args**: `Tauri Dev`

   #### **Tauri Build**

   - **Command**: `workbench.action.tasks.runTask`
   - **Key**: `F6` (or `Ctrl + Shift + B`)
   - **Args**: `Tauri Build`

   #### **React Dev Only**

   - **Command**: `workbench.action.tasks.runTask`
   - **Key**: `F7` (or `Ctrl + Shift + R`)
   - **Args**: `React Dev Only`

   > **Note**: `Ctrl + Shift + T` is already used by VS Code to open workspace keybindings.json

### **Method 2: Command Palette (Always Works)**

1. Press `Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select the desired task:
   - **"Tauri Dev"** (for desktop app)
   - **"React Dev Only"** (for browser)
   - **"Tauri Build"** (for production build)

---

## 🚀 Testing Your Setup

### **1. Test Task Execution**

Try running tasks manually first:

- `Ctrl + Shift + P` → "Tasks: Run Task" → "Tauri Dev"

### **2. Verify Desktop App**

When Tauri Dev runs successfully:

- ✅ Desktop window opens
- ✅ "Binary File Analyzer" section appears
- ✅ "Select .bin File" button works
- ✅ File dialog opens for .bin files

### **3. Test .bin File Analysis**

1. Click "Select .bin File"
2. Choose any .bin file
3. See analysis results:
   - File size and entropy
   - Byte statistics
   - Hex preview
   - Binary data summary

---

## 📝 Alternative Methods

### **Quick Access via File Menu**

1. **Terminal** → **Run Task** → **Tauri Dev**
2. Or use the Command Palette: `Ctrl + Shift + P` → **Tasks: Run Task**

### **Create Custom Shortcuts**

If the above doesn't work, create your own shortcuts:

1. **Settings** → **Keyboard Shortcuts** → **Open Keyboard Shortcuts (JSON)**
2. Add custom shortcuts:

```json
[
  {
    "key": "f5",
    "command": "workbench.action.tasks.runTask",
    "args": "Tauri Dev"
  }
]
```

---

## 🔧 Troubleshooting

### **If Shortcuts Don't Work**

1. **Check for conflicts**: Some shortcuts might be taken by other VS Code extensions
2. **Try different keys**: Use `F5`, `F6`, etc. instead of Ctrl combinations
3. **Use Command Palette**: Always reliable fallback

### **If Tasks Fail**

1. **Restart VS Code**: Reload the workspace
2. **Check terminal output**: Look for specific error messages
3. **Manual terminal**: Run `cargo tauri dev` directly in terminal

---

## 🎊 Current Status

### **✅ Working Features**

- ✅ **Tasks**: Confirmed working via "Run Task" menu
- ✅ **Binary File Viewer**: Ready to test with .bin files
- ✅ **Rust + React Integration**: Complete desktop app
- ✅ **PATH Resolution**: Batch file handles cargo location

### **🔄 Manual Setup Needed**

- ⌨️ **Keyboard Shortcuts**: Manual assignment required
- 📁 **File Testing**: Ready for .bin file selection

## 💡 Recommended Next Steps

1. **Set up your preferred keyboard shortcut** for "Tauri Dev" using Method 1 or 2
2. **Test the .bin file analyzer** by running the task
3. **Create a sample .bin file** if needed for testing

**The core functionality is complete - just need to set up the shortcuts manually!**

🦀⚛️ Your React + Rust desktop app is ready for .bin file analysis!
