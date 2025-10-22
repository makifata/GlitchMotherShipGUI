# React useState - C 言語エンジニア向け解説

## C 言語と React の変数管理の違い

### C 言語の場合:

```c
#include <stdio.h>

int main() {
    int batteryLevel = 0;        // グローバル変数
    int isConnected = 0;         // 0=false, 1=true

    // 値を変更
    batteryLevel = 85;
    isConnected = 1;

    printf("Battery: %d%%\n", batteryLevel);
    printf("Connected: %s\n", isConnected ? "Yes" : "No");

    return 0;
}
```

### React useState の場合:

```javascript
import { useState } from 'react';

function App() {
  // C言語の変数宣言に相当
  const [batteryLevel, setBatteryLevel] = useState(0); // int batteryLevel = 0;
  const [isConnected, setIsConnected] = useState(false); // int isConnected = 0;

  // 値を変更する関数（C言語の代入に相当）
  const updateBattery = () => {
    setBatteryLevel(85); // batteryLevel = 85; と同じ
    setIsConnected(true); // isConnected = 1; と同じ
  };

  return (
    <div>
      <p>Battery: {batteryLevel}%</p>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <button onClick={updateBattery}>Update</button>
    </div>
  );
}
```

## 重要な違い：再描画（Re-rendering）

### C 言語の場合:

```c
int counter = 0;

void increment() {
    counter++;
    printf("Counter: %d\n", counter);  // 手動でprintfを呼ぶ必要がある
}
```

### React useState の場合:

```javascript
function Counter() {
  const [counter, setCounter] = useState(0);

  const increment = () => {
    setCounter(counter + 1); // 値を更新すると自動で画面が再描画される！
  };

  return (
    <div>
      <p>Counter: {counter}</p> {/* 自動で最新の値が表示される */}
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

## useState の分解代入について

C 言語では配列を返す関数は面倒ですが、JavaScript では簡単です：

```javascript
// useState は [現在の値, 更新関数] の配列を返す
const [value, setValue] = useState(初期値);

// これは以下と同じ意味：
const stateArray = useState(初期値);
const value = stateArray[0]; // 現在の値
const setValue = stateArray[1]; // 更新関数
```

## 実際のファームウェアダウンローダーのコード解説

```javascript
function App() {
  // C言語の変数宣言に相当
  const [progress, setProgress] = useState(0); // int progress = 0;
  const [status, setStatus] = useState('Standby'); // char status[] = "Standby";
  const [isConnected, setIsConnected] = useState(false); // int isConnected = 0;
  const [batteryLevel, setBatteryLevel] = useState(0); // int batteryLevel = 0;

  // C言語の関数に相当
  const downloadFirmware = async () => {
    setStatus('Downloading...'); // strcpy(status, "Downloading...");

    // C言語のfor文と同じ
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200)); // sleep(200ms)
      setProgress(i); // progress = i;
    }

    setStatus('Completed!'); // strcpy(status, "Completed!");
  };

  return (
    // HTMLを返す（C言語のprintf相当）
    <div>
      <h1>Firmware Downloader</h1>
      <p>Status: {status}</p>
      <p>Progress: {progress}%</p>
      <p>Battery: {batteryLevel}%</p>
      <button onClick={downloadFirmware}>Download</button>
    </div>
  );
}
```

## useEffect も一緒に理解しましょう

C 言語で定期的な処理を行う場合：

```c
#include <pthread.h>
#include <unistd.h>

void* battery_monitor(void* arg) {
    while(1) {
        // バッテリーレベルを取得して更新
        int newLevel = getBatteryFromDevice();
        batteryLevel = newLevel;
        sleep(3);  // 3秒待機
    }
    return NULL;
}

int main() {
    pthread_t thread;
    pthread_create(&thread, NULL, battery_monitor, NULL);
    // メインプログラム続行
    return 0;
}
```

React useEffect の場合：

```javascript
import { useState, useEffect } from 'react';

function App() {
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // C言語のpthreadに相当する処理
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        // バッテリーレベルを更新（ダミーデータ）
        setBatteryLevel(prev => {
          const newLevel = prev + (Math.random() - 0.5) * 2;
          return Math.max(0, Math.min(100, newLevel));
        });
      }
    }, 3000); // 3秒ごと

    // cleanup関数（C言語のpthread_cancelに相当）
    return () => clearInterval(interval);
  }, [isConnected]); // isConnectedが変わった時だけ実行

  return <div>Battery: {batteryLevel}%</div>;
}
```

## イベントハンドリング（Event Handling）

### C 言語の場合:

```c
#include <stdio.h>

void button_click_handler() {
    printf("Button was clicked!\n");
    // 何かの処理を実行
}

int main() {
    // C言語ではGUIライブラリを使う必要がある
    // 例：Windows API, GTK, Qt など
    button_click_handler(); // 手動で関数を呼び出す
    return 0;
}
```

### React の場合:

```javascript
function App() {
  const [isConnected, setIsConnected] = useState(false);

  // C言語の関数に相当
  const handleConnectClick = () => {
    console.log('Connect button was clicked!');
    setIsConnected(true);
  };

  const handleDownloadClick = () => {
    console.log('Download button was clicked!');
    // ダウンロード処理
  };

  return (
    <div>
      {/* onClick でイベントハンドラーを指定 */}
      <button onClick={handleConnectClick}>Connect Device</button>
      <button onClick={handleDownloadClick}>Download Firmware</button>
    </div>
  );
}
```

**ファームウェアダウンローダーでの実例**:

```javascript
// この例では以下のイベントハンドリングが使われています：
<button onClick={connectDevice}>    // デバイス接続ボタン
<button onClick={downloadFirmware}> // ファームウェアダウンロードボタン
```

## 条件付きレンダリング（Conditional Rendering）

### C 言語の場合:

```c
#include <stdio.h>

int isConnected = 0;
int batteryLevel = 75;

void display_ui() {
    printf("Device Status:\n");

    if (isConnected) {
        printf("Connected: AmbiqSuite Device\n");
        printf("Battery: %d%%\n", batteryLevel);
    } else {
        printf("Not Connected\n");
    }
}
```

### React の場合:

```javascript
function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(75);

  return (
    <div>
      <h3>Device Status</h3>

      {/* 条件付きレンダリング方法1: 論理演算子 && */}
      {isConnected && (
        <div>
          <p>Connected: AmbiqSuite Device</p>
          <p>Battery: {batteryLevel}%</p>
        </div>
      )}

      {/* 条件付きレンダリング方法2: 三項演算子 */}
      <p>{isConnected ? 'Connected' : 'Not Connected'}</p>

      {/* 条件付きレンダリング方法3: if文を使った関数 */}
      {renderConnectionStatus()}
    </div>
  );

  function renderConnectionStatus() {
    if (isConnected) {
      return <p style={{ color: 'green' }}>Device Online</p>;
    } else {
      return <p style={{ color: 'gray' }}>Device Offline</p>;
    }
  }
}
```

**ファームウェアダウンローダーでの実例**:

```javascript
// バッテリーレベルを接続時のみ表示
{
  isConnected && (
    <div style={{ marginBottom: '15px' }}>
      <span>Battery:</span>
      <div>バッテリーバー表示</div>
      <span>{batteryLevel.toFixed(0)}%</span>
    </div>
  );
}

// 接続状態による表示切り替え
<span>{isConnected ? `Connected: ${deviceName}` : 'Not Connected'}</span>;

// プログレスバーを進捗がある時のみ表示
{
  progress > 0 && (
    <div>
      <progress value={progress} max={100} />
      <span>{progress}%</span>
    </div>
  );
}

// ボタンの有効/無効制御
<button
  onClick={downloadFirmware}
  disabled={!isConnected} // 未接続時は無効化
>
  Download Firmware
</button>;
```

## まとめ：C 言語との対応表

| 機能         | C 言語                       | React                            |
| ------------ | ---------------------------- | -------------------------------- |
| 変数宣言     | `int x = 0;`                 | `const [x, setX] = useState(0);` |
| 値の更新     | `x = 5;`                     | `setX(5);`                       |
| 画面表示     | `printf("%d", x);`           | `<p>{x}</p>`                     |
| イベント処理 | 手動で関数呼び出し           | `<button onClick={handler}>`     |
| 条件分岐表示 | `if (condition) printf(...)` | `{condition && <div>...</div>}`  |
| 三項演算子   | `condition ? "A" : "B"`      | `{condition ? "A" : "B"}`        |
| 定期処理     | `while(1) { ... sleep(1); }` | `setInterval(() => {...}, 1000)` |
| スレッド処理 | `pthread_create`             | `useEffect(() => {...}, [])`     |
| UI 更新      | 手動で printf を呼ぶ         | 自動で再描画される               |

**重要なポイント**:

- useState で値を更新すると、**自動で画面が再描画**されます
- C 言語のように手動で printf()を呼ぶ必要はありません
- **イベントハンドリング**と**条件付きレンダリング**により、動的な UI が簡単に作れます
- これが React の最大の利点です！
