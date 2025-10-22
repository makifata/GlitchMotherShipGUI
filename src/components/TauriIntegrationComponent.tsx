import { invoke } from '@tauri-apps/api/core';
import React, { useEffect, useState } from 'react';

// Type declaration for Tauri global
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

// Check if we're running in a Tauri context
const isTauriContext = () => {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
};

interface TauriIntegrationComponentProps {
  className?: string;
}

const TauriIntegrationComponent: React.FC<TauriIntegrationComponentProps> = ({
  className = '',
}) => {
  const [greeting, setGreeting] = useState<string>('');
  const [name, setName] = useState<string>('React User');
  const [systemInfo, setSystemInfo] = useState<string>('');
  const [progressData, setProgressData] = useState<number>(0);
  const [processedData, setProcessedData] = useState<number[]>([]);
  const [inputNumbers, setInputNumbers] = useState<string>('1,2,3,4,5');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to call Rust's greet command
  const callRustGreet = async () => {
    if (!isTauriContext()) {
      setGreeting(
        '❌ Tauri not available - run "npm run tauri:dev" instead of "npm run dev"'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await invoke<string>('greet', { name });
      setGreeting(result);
    } catch (error) {
      console.error('Error calling greet:', error);
      setGreeting('Error calling Rust function');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get system info from Rust
  const getSystemInfo = async () => {
    if (!isTauriContext()) {
      setSystemInfo(
        '❌ Tauri not available\n\nTo use Tauri features, please run:\n"npm run tauri:dev"\n\ninstead of "npm run dev"'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await invoke<string>('get_system_info');
      setSystemInfo(result);
    } catch (error) {
      console.error('Error getting system info:', error);
      setSystemInfo('Error getting system information');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to calculate progress using Rust
  const calculateProgress = async (
    start: number,
    end: number,
    current: number
  ) => {
    if (!isTauriContext()) {
      return 0;
    }

    try {
      const result = await invoke<number>('calculate_progress', {
        start,
        end,
        current,
      });
      setProgressData(result);
      return result;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  // Function to process data with Rust
  const processData = async () => {
    if (!isTauriContext()) {
      setProcessedData([]);
      return;
    }

    setIsLoading(true);
    try {
      const numbers = inputNumbers
        .split(',')
        .map(n => parseInt(n.trim()))
        .filter(n => !isNaN(n));
      const result = await invoke<number[]>('process_data', { data: numbers });
      setProcessedData(result);
    } catch (error) {
      console.error('Error processing data:', error);
      setProcessedData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo progress animation
  const startProgressDemo = async () => {
    if (!isTauriContext()) {
      return;
    }

    const start = 0;
    const end = 100;

    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await calculateProgress(start, end, i);
    }
  };

  // Load system info on component mount
  useEffect(() => {
    getSystemInfo();
  }, []);

  return (
    <div className={`tauri-integration-container ${className}`}>
      <div className="tauri-header">
        <h2>🦀 Tauri + React Integration</h2>
        <p>ReactからRustの関数を呼び出すデモ</p>
        {!isTauriContext() && (
          <div className="tauri-warning">
            ⚠️ Running in web mode - Use <code>npm run tauri:dev</code> for full
            functionality
          </div>
        )}
      </div>

      {/* Greeting Section */}
      <div className="tauri-section">
        <h3>🤝 Greeting from Rust</h3>
        <div className="input-group">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            className="tauri-input"
          />
          <button
            onClick={callRustGreet}
            disabled={isLoading}
            className="tauri-button primary"
          >
            {isLoading ? 'Calling Rust...' : 'Greet from Rust'}
          </button>
        </div>
        {greeting && (
          <div className="rust-response">
            <strong>Rust says:</strong> {greeting}
          </div>
        )}
      </div>

      {/* Progress Calculation Section */}
      <div className="tauri-section">
        <h3>📊 Progress Calculator (Rust)</h3>
        <div className="progress-demo">
          <div className="progress-bar-rust">
            <div
              className="progress-fill-rust"
              style={{ width: `${progressData}%` }}
            />
          </div>
          <span className="progress-text-rust">{progressData.toFixed(1)}%</span>
        </div>
        <button
          onClick={startProgressDemo}
          disabled={isLoading}
          className="tauri-button secondary"
        >
          Start Rust Progress Demo
        </button>
      </div>

      {/* Data Processing Section */}
      <div className="tauri-section">
        <h3>🔢 Data Processing (Rust)</h3>
        <div className="input-group">
          <input
            type="text"
            value={inputNumbers}
            onChange={e => setInputNumbers(e.target.value)}
            placeholder="Enter numbers separated by commas"
            className="tauri-input"
          />
          <button
            onClick={processData}
            disabled={isLoading}
            className="tauri-button primary"
          >
            Process with Rust
          </button>
        </div>
        {processedData.length > 0 && (
          <div className="rust-response">
            <strong>Original:</strong> [{inputNumbers}]<br />
            <strong>Processed (×2):</strong> [{processedData.join(', ')}]
          </div>
        )}
      </div>

      {/* System Info Section */}
      <div className="tauri-section">
        <h3>💻 System Information (Rust)</h3>
        <button
          onClick={getSystemInfo}
          disabled={isLoading}
          className="tauri-button secondary"
        >
          Get System Info
        </button>
        {systemInfo && (
          <div className="system-info">
            <pre>{systemInfo}</pre>
          </div>
        )}
      </div>

      <style>{`
        .tauri-integration-container {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .tauri-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .tauri-header h2 {
          margin: 0 0 10px 0;
          font-size: 1.8rem;
        }

        .tauri-header p {
          margin: 0;
          opacity: 0.9;
        }

        .tauri-warning {
          margin-top: 15px;
          padding: 10px;
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid rgba(255, 193, 7, 0.5);
          border-radius: 6px;
          color: #856404;
          font-size: 14px;
        }

        .tauri-warning code {
          background: rgba(255, 255, 255, 0.3);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }

        .tauri-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .tauri-section h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 1.2rem;
        }

        .input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .tauri-input {
          flex: 1;
          min-width: 200px;
          padding: 10px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .tauri-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .tauri-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .tauri-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tauri-button.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }

        .tauri-button.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
        }

        .tauri-button.secondary {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          color: #333;
          box-shadow: 0 2px 4px rgba(252, 182, 159, 0.3);
        }

        .tauri-button.secondary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(252, 182, 159, 0.4);
        }

        .rust-response {
          background: #e8f5e8;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #28a745;
          margin-top: 10px;
          font-family: 'Courier New', monospace;
        }

        .system-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          margin-top: 10px;
        }

        .system-info pre {
          margin: 0;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #333;
        }

        .progress-demo {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .progress-bar-rust {
          flex: 1;
          height: 25px;
          background-color: #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .progress-fill-rust {
          height: 100%;
          background: linear-gradient(90deg, #ff7e5f 0%, #feb47b 100%);
          border-radius: 12px;
          transition: width 0.3s ease;
          position: relative;
        }

        .progress-text-rust {
          font-weight: bold;
          color: #333;
          min-width: 60px;
          text-align: right;
          font-size: 16px;
        }

        @media (max-width: 600px) {
          .input-group {
            flex-direction: column;
          }
          
          .tauri-input {
            min-width: auto;
          }
          
          .progress-demo {
            flex-direction: column;
            align-items: stretch;
          }
          
          .progress-text-rust {
            text-align: center;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default TauriIntegrationComponent;
