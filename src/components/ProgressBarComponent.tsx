import React, { useState } from 'react';

interface ProgressBarComponentProps {
  duration?: number; // Duration of animation in milliseconds
  className?: string;
}

const ProgressBarComponent: React.FC<ProgressBarComponentProps> = ({
  duration = 3000,
  className = '',
}) => {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const startProgress = () => {
    if (isAnimating) return;

    setProgress(0);
    setIsAnimating(true);

    const steps = 100;
    const interval = duration / steps;
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timer);
        setIsAnimating(false);
      }
    }, interval);
  };

  const resetProgress = () => {
    setProgress(0);
    setIsAnimating(false);
  };

  return (
    <div className={`progress-bar-container ${className}`}>
      <div className="progress-bar-header">
        <h3>プログレスバーコンポーネント</h3>
        <div className="button-group">
          <button
            onClick={startProgress}
            disabled={isAnimating}
            className={`start-button ${isAnimating ? 'disabled' : ''}`}
          >
            {isAnimating ? 'アニメーション中...' : 'スタート'}
          </button>
          <button
            onClick={resetProgress}
            disabled={isAnimating}
            className={`reset-button ${isAnimating ? 'disabled' : ''}`}
          >
            リセット
          </button>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">{progress}%</div>
      </div>

      <style>{`
        .progress-bar-container {
          max-width: 500px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .progress-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .progress-bar-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.2rem;
        }

        .button-group {
          display: flex;
          gap: 10px;
        }

        .start-button {
          background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
        }

        .start-button:hover:not(.disabled) {
          background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
        }

        .reset-button {
          background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
        }

        .reset-button:hover:not(.disabled) {
          background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
        }

        .start-button.disabled,
        .reset-button.disabled {
          background: #cccccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .progress-bar {
          flex: 1;
          height: 20px;
          background-color: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            #4caf50 0%,
            #8bc34a 50%,
            #4caf50 100%
          );
          border-radius: 10px;
          transition: width 0.5s ease-out;
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
        }

        .progress-text {
          font-weight: bold;
          color: #333;
          min-width: 45px;
          text-align: right;
          font-size: 16px;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressBarComponent;
