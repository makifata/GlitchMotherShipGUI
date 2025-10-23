import { Button } from '@/components/ui/button';
import './App.css';
import BinaryFileViewer from './components/BinaryFileViewer';
import COMPortSelect from './components/COMPortSelect';
import GCPCommunication from './components/GCPCommunication';
import ProgressBarComponent from './components/ProgressBarComponent';
import TauriIntegrationComponent from './components/TauriIntegrationComponent';
import {
  ConnectionProvider,
  useConnection,
} from './contexts/ConnectionContext';

function AppContent() {
  // Theme Control - Change this to switch between light and dark mode
  const isDarkMode = true; // Set to false for light mode, true for dark mode

  const { isConnected, connectedPort, disconnect } = useConnection();

  // Show COM Port Selection Screen
  if (!isConnected) {
    return (
      <div
        className={`min-h-screen bg-background flex items-center justify-center overflow-hidden`}
      >
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="mb-4">
            <h1 className="text-xl font-bold mb-1 gradient-text">
              Glitchi Mothership
            </h1>
          </div>
          <COMPortSelect />
        </div>
      </div>
    );
  }

  // Show Demo Screen after connection
  return (
    <div className="App bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <header className="app-header pt-8 pb-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          GlitchMothership GUI
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Connected to {connectedPort} - Tauri + React + TypeScript + Tailwind
          CSS + shadcn/ui
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <Button variant="destructive" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      </header>

      <main className="app-main">
        {/* GCP Communication Section */}
        <GCPCommunication />

        {/* Binary File Viewer Section */}
        <BinaryFileViewer />

        {/* Tauri Integration Section */}
        <TauriIntegrationComponent />

        {/* Original Progress Bar Section */}
        <div className="demo-section">
          <h2>React プログレスバー</h2>
          <p>純粋なReactコンポーネントで作成されたプログレスバー</p>
          <ProgressBarComponent duration={3000} />

          <div className="progress-subsection">
            <h3>異なる速度のプログレスバー</h3>
            <div className="progress-bars">
              <div className="progress-demo">
                <h4>高速（1秒）</h4>
                <ProgressBarComponent duration={1000} />
              </div>

              <div className="progress-demo">
                <h4>通常（3秒）</h4>
                <ProgressBarComponent duration={3000} />
              </div>

              <div className="progress-demo">
                <h4>低速（5秒）</h4>
                <ProgressBarComponent duration={5000} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .App {
          text-align: center;
          background-color: #f5f5f5;
          min-height: 100vh;
          padding: 20px;
        }
        
        .app-header {
          margin-bottom: 30px;
        }
        
        .app-header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2.5rem;
        }
        
        .app-header p {
          color: #666;
          font-size: 1.1rem;
        }
        
        .app-main {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .demo-section {
          margin-top: 40px;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .demo-section h2 {
          color: #333;
          margin-bottom: 30px;
        }
        
        .progress-bars {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .progress-demo {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .progress-demo h3 {
          color: #495057;
          margin-bottom: 15px;
          font-size: 1.1rem;
        }
        
        @media (min-width: 768px) {
          .progress-bars {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <ConnectionProvider>
      <AppContent />
    </ConnectionProvider>
  );
}

export default App;
