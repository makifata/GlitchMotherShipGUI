import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import React, { useState } from 'react';

interface FileAnalysis {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileSizeFormatted: string;
  mostCommonByte: string;
  entropy: number;
  preview: string;
  statistics: {
    nullBytes: number;
    printableChars: number;
    highBytes: number;
  };
}

interface BinaryFileViewerProps {
  className?: string;
}

const BinaryFileViewer: React.FC<BinaryFileViewerProps> = ({
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null);
  const [binaryData, setBinaryData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const selectBinFile = async () => {
    setIsLoading(true);
    setError('');

    try {
      const selected = await open({
        title: 'Select a .bin file',
        multiple: false,
        filters: [
          {
            name: 'Binary Files',
            extensions: ['bin'],
          },
        ],
      });

      if (selected && typeof selected === 'string') {
        setSelectedFile(selected);
        await analyzeBinFile(selected);
      } else {
        setError('No file selected');
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      setError('Failed to open file dialog');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeBinFile = async (filePath: string) => {
    try {
      // Get file analysis
      const analysis = await invoke<FileAnalysis>('analyze_bin_file', {
        filePath,
      });
      setFileAnalysis(analysis);

      // Read binary data
      const data = await invoke<number[]>('read_bin_file', {
        filePath,
      });
      setBinaryData(data);
    } catch (error) {
      console.error('Error analyzing file:', error);
      setError(`Failed to analyze file: ${error}`);
      setFileAnalysis(null);
      setBinaryData([]);
    }
  };

  const clearSelection = () => {
    setSelectedFile('');
    setFileAnalysis(null);
    setBinaryData([]);
    setError('');
  };

  return (
    <div className={`binary-file-viewer ${className}`}>
      <div className="file-selector">
        <h2>📁 Binary File Analyzer</h2>
        <p>.bin ファイルを選択してバイナリデータを解析します</p>

        <div className="file-controls">
          <button
            onClick={selectBinFile}
            disabled={isLoading}
            className="select-file-button"
          >
            {isLoading ? 'Loading...' : 'Select .bin File'}
          </button>

          {selectedFile && (
            <button
              onClick={clearSelection}
              disabled={isLoading}
              className="clear-button"
            >
              Clear
            </button>
          )}
        </div>

        {error && <div className="error-message">❌ {error}</div>}
      </div>

      {fileAnalysis && (
        <div className="file-analysis">
          <h3>📊 File Information</h3>

          <div className="info-grid">
            <div className="info-item">
              <label>File Name:</label>
              <span>{fileAnalysis.fileName}</span>
            </div>

            <div className="info-item">
              <label>File Size:</label>
              <span>
                {fileAnalysis.fileSizeFormatted} ({fileAnalysis.fileSize} bytes)
              </span>
            </div>

            <div className="info-item">
              <label>Most Common Byte:</label>
              <span>{fileAnalysis.mostCommonByte}</span>
            </div>

            <div className="info-item">
              <label>Entropy:</label>
              <span>{fileAnalysis.entropy.toFixed(3)} bits</span>
            </div>
          </div>

          <div className="statistics">
            <h4>📈 Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <label>Null Bytes (0x00):</label>
                <span>{fileAnalysis.statistics.nullBytes}</span>
              </div>
              <div className="stat-item">
                <label>Printable Characters:</label>
                <span>{fileAnalysis.statistics.printableChars}</span>
              </div>
              <div className="stat-item">
                <label>High Bytes (&gt;127):</label>
                <span>{fileAnalysis.statistics.highBytes}</span>
              </div>
            </div>
          </div>

          <div className="hex-preview">
            <h4>🔍 Hex Preview (First 256 bytes)</h4>
            <pre className="hex-display">{fileAnalysis.preview}</pre>
          </div>

          {binaryData.length > 0 && (
            <div className="binary-summary">
              <h4>💾 Binary Data Summary</h4>
              <p>
                <strong>Total bytes loaded:</strong> {binaryData.length}
                <br />
                <strong>First 20 bytes:</strong> [
                {binaryData
                  .slice(0, 20)
                  .map(
                    b => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`
                  )
                  .join(', ')}
                {binaryData.length > 20 ? ', ...' : ''}]
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .binary-file-viewer {
          max-width: 1000px;
          margin: 20px auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .file-selector {
          text-align: center;
          margin-bottom: 30px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .file-selector h2 {
          margin: 0 0 10px 0;
          font-size: 1.8rem;
        }

        .file-selector p {
          margin: 0 0 20px 0;
          opacity: 0.9;
        }

        .file-controls {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .select-file-button {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
        }

        .select-file-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(76, 175, 80, 0.4);
        }

        .select-file-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .clear-button {
          background: linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
        }

        .clear-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(255, 107, 107, 0.4);
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          border: 1px solid #ffcdd2;
        }

        .file-analysis {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .file-analysis h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.4rem;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }

        .file-analysis h4 {
          margin: 25px 0 15px 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .info-item label {
          font-weight: 600;
          color: #495057;
        }

        .info-item span {
          font-family: 'Courier New', monospace;
          color: #333;
          font-weight: 500;
        }

        .statistics {
          margin-bottom: 25px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 15px;
          background: #e3f2fd;
          border-radius: 6px;
          border-left: 4px solid #2196f3;
        }

        .stat-item label {
          font-weight: 500;
          color: #1565c0;
        }

        .stat-item span {
          font-family: 'Courier New', monospace;
          color: #0d47a1;
          font-weight: bold;
        }

        .hex-preview {
          margin-bottom: 25px;
        }

        .hex-display {
          background: #263238;
          color: #00e676;
          padding: 20px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          overflow-x: auto;
          white-space: pre;
          border: 1px solid #37474f;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .binary-summary {
          background: #f1f8e9;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #c8e6c9;
          border-left: 5px solid #4caf50;
        }

        .binary-summary p {
          margin: 0;
          color: #2e7d32;
          line-height: 1.6;
        }

        .binary-summary strong {
          color: #1b5e20;
        }

        @media (max-width: 768px) {
          .file-controls {
            flex-direction: column;
            align-items: center;
          }
          
          .select-file-button, .clear-button {
            min-width: 200px;
          }
          
          .info-grid, .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .info-item {
            flex-direction: column;
            text-align: center;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default BinaryFileViewer;
