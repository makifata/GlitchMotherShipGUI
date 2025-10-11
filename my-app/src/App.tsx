// src/App.tsx - Firmware downloader UI with device status
import { useEffect, useState } from 'react';

function App() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Standby');
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [deviceName, setDeviceName] = useState('');

  // Simulate device connection and battery updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate battery level changes (dummy data)
      if (isConnected) {
        setBatteryLevel(prev => {
          const newLevel = prev + (Math.random() - 0.5) * 2;
          return Math.max(0, Math.min(100, newLevel));
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const connectDevice = () => {
    if (!isConnected) {
      setStatus('Connecting to device...');
      setTimeout(() => {
        setIsConnected(true);
        setDeviceName('AmbiqSuite Device');
        setBatteryLevel(Math.floor(Math.random() * 100));
        setStatus('Device connected');
      }, 2000);
    } else {
      setIsConnected(false);
      setDeviceName('');
      setBatteryLevel(0);
      setStatus('Device disconnected');
    }
  };

  const downloadFirmware = async () => {
    if (!isConnected) {
      setStatus('Error: Device not connected');
      return;
    }

    setStatus('Downloading...');
    // Mock download simulation
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }
    setStatus('Firmware download completed!');
  };

  const getBatteryColor = () => {
    if (batteryLevel > 50) return '#4CAF50'; // Green
    if (batteryLevel > 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getConnectionColor = () => {
    return isConnected ? '#4CAF50' : '#9E9E9E';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Glitchi - MotherShip</h1>

      {/* Device Status Panel */}
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3>Device Status</h3>

        {/* Connection Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getConnectionColor(),
              marginRight: '8px',
            }}
          />
          <span>
            {isConnected ? `Connected: ${deviceName}` : 'Not Connected'}
          </span>
        </div>

        {/* Battery Level */}
        {isConnected && (
          <div style={{ marginBottom: '15px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '5px',
              }}
            >
              <span style={{ marginRight: '10px' }}>Battery:</span>
              <div
                style={{
                  width: '100px',
                  height: '20px',
                  border: '1px solid #ccc',
                  borderRadius: '10px',
                  backgroundColor: '#f0f0f0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${batteryLevel}%`,
                    height: '100%',
                    backgroundColor: getBatteryColor(),
                    borderRadius: '10px',
                    transition: 'all 0.3s ease',
                  }}
                />
              </div>
              <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
                {batteryLevel.toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        <button
          onClick={connectDevice}
          style={{
            padding: '8px 16px',
            backgroundColor: isConnected ? '#f44336' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {isConnected ? 'Disconnect' : 'Connect Device'}
        </button>
      </div>

      {/* Firmware Download Section */}
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3>Firmware Download</h3>
        <button
          onClick={downloadFirmware}
          disabled={!isConnected}
          style={{
            padding: '10px 20px',
            backgroundColor: isConnected ? '#4CAF50' : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            marginBottom: '15px',
          }}
        >
          Download Firmware
        </button>

        <p>
          <strong>Status:</strong> {status}
        </p>

        {progress > 0 && (
          <div style={{ marginTop: '10px' }}>
            <progress value={progress} max={100} style={{ width: '100%' }} />
            <div style={{ textAlign: 'center', marginTop: '5px' }}>
              <span>{progress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
