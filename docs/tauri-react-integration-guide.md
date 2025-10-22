# Tauri + React + TypeScript 統合ガイド

## 🎉 完成したもの

React + Rust デスクトップアプリケーションを作成しました！

### 📋 プロジェクト構成

```
my-app/
├── src/                          # React フロントエンド
│   ├── components/
│   │   ├── ProgressBarComponent.tsx      # 純React プログレスバー
│   │   └── TauriIntegrationComponent.tsx # Rust統合コンポーネント
│   └── App.tsx                   # メインアプリケーション
├── src-tauri/                    # Rust バックエンド
│   ├── src/
│   │   ├── main.rs              # エントリーポイント
│   │   └── lib.rs               # Rustコマンド定義
│   ├── Cargo.toml               # Rust依存関係
│   └── tauri.conf.json          # Tauri設定
└── package.json                 # Node.js依存関係
```

---

## 🦀 Rust バックエンド機能

### 実装した Rust コマンド

#### 1. **greet** - 挨拶機能

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've called me from React!", name)
}
```

- React から名前を受け取り、Rust で挨拶メッセージを生成

#### 2. **calculate_progress** - 進行状況計算

```rust
#[tauri::command]
fn calculate_progress(start: f64, end: f64, current: f64) -> f64 {
    if end <= start {
        return 0.0;
    }

    let progress = (current - start) / (end - start) * 100.0;
    progress.max(0.0).min(100.0)
}
```

- 開始点、終了点、現在位置から進行率を計算
- React のプログレスバーより高精度な計算を Rust で実行

#### 3. **get_system_info** - システム情報取得

```rust
#[tauri::command]
fn get_system_info() -> String {
    format!(
        "Operating System: {}\nArchitecture: {}\nRust Version: {}",
        std::env::consts::OS,
        std::env::consts::ARCH,
        "1.90.0"
    )
}
```

- OS、アーキテクチャ、Rust バージョン情報を取得

#### 4. **process_data** - データ処理

```rust
#[tauri::command]
fn process_data(data: Vec<i32>) -> Vec<i32> {
    data.iter().map(|x| x * 2).collect()
}
```

- 配列の各要素を 2 倍にする高速処理を Rust で実行

---

## ⚛️ React フロントエンド機能

### TauriIntegrationComponent の特徴

#### **双方向通信**

```tsx
// Rust の greet コマンドを呼び出し
const callRustGreet = async () => {
  const result = await invoke<string>('greet', { name });
  setGreeting(result);
};
```

#### **非同期処理**

```tsx
// Rust での進行状況計算
const calculateProgress = async (
  start: number,
  end: number,
  current: number
) => {
  const result = await invoke<number>('calculate_progress', {
    start,
    end,
    current,
  });
  setProgressData(result);
  return result;
};
```

#### **エラーハンドリング**

```tsx
try {
  const result = await invoke<string>('get_system_info');
  setSystemInfo(result);
} catch (error) {
  console.error('Error getting system info:', error);
  setSystemInfo('Error getting system information');
}
```

---

## 🌟 主な機能デモ

### 1. **挨拶機能**

- テキストボックスに名前を入力
- "Greet from Rust" ボタンをクリック
- Rust が挨拶メッセージを生成して返却

### 2. **Rust プログレスバー**

- "Start Rust Progress Demo" ボタンをクリック
- Rust で計算された進行状況をリアルタイム表示
- CSS transition でスムーズなアニメーション

### 3. **データ処理**

- カンマ区切りの数値を入力
- "Process with Rust" ボタンをクリック
- Rust が各数値を 2 倍に処理して結果を表示

### 4. **システム情報**

- "Get System Info" ボタンをクリック
- Rust でシステム情報を取得して表示

---

## 🚀 実行方法

### 開発モード

```bash
cargo tauri dev
```

- React 開発サーバーと Rust アプリケーションが同時に起動
- ファイル変更時の自動リロード対応

### ビルド

```bash
cargo tauri build
```

- 本番用実行ファイル (.exe) の生成
- Windows/macOS/Linux 対応

---

## 🏗️ 技術スタック

### **フロントエンド**

- **React 18** - UI ライブラリ
- **TypeScript** - 型安全性
- **Vite** - 高速ビルドツール
- **CSS-in-JS** - コンポーネント内スタイリング

### **バックエンド**

- **Rust** - システムプログラミング言語
- **Tauri** - デスクトップアプリフレームワーク
- **Serde** - シリアライゼーション
- **Tokio** - 非同期ランタイム

### **通信**

- **@tauri-apps/api** - React-Rust 通信
- **JSON-RPC** - コマンド呼び出しプロトコル

---

## 💡 Tauri の利点

### **1. パフォーマンス**

- **ネイティブ速度**: C/C++並みの高速処理
- **軽量**: Electron よりも CPU・メモリ使用量が少ない
- **並列処理**: Rust の安全な並行プログラミング

### **2. セキュリティ**

- **メモリ安全**: Rust のゼロコスト抽象化
- **サンドボックス**: Web ビューとネイティブ間の安全な通信
- **API 制限**: 必要な機能のみ公開

### **3. 開発体験**

- **型安全**: TypeScript + Rust の型チェック
- **ホットリロード**: 開発時の即座の反映
- **デバッグ**: ブラウザ開発者ツールと Rust デバッガー

### **4. 配布**

- **単一実行ファイル**: 依存関係を含む独立したアプリ
- **小さなサイズ**: 数 MB 程度の軽量アプリ
- **マルチプラットフォーム**: Windows/macOS/Linux 対応

---

## 🔧 カスタマイズ方法

### **新しい Rust コマンドの追加**

1. **`src-tauri/src/lib.rs` にコマンド追加:**

```rust
#[tauri::command]
fn my_new_command(input: String) -> String {
    // Rust での処理
    format!("Processed: {}", input)
}
```

2. **コマンドハンドラーに登録:**

```rust
.invoke_handler(tauri::generate_handler![
    greet,
    calculate_progress,
    get_system_info,
    process_data,
    my_new_command  // 追加
])
```

3. **React で呼び出し:**

```tsx
const result = await invoke<string>('my_new_command', { input: 'test' });
```

### **ウィンドウ設定のカスタマイズ**

`src-tauri/tauri.conf.json`:

```json
{
  "app": {
    "windows": [
      {
        "title": "My Custom App",
        "width": 1000,
        "height": 700,
        "resizable": true,
        "center": true
      }
    ]
  }
}
```

---

## 📚 学習リソース

### **公式ドキュメント**

- [Tauri 公式サイト](https://tauri.app/)
- [Tauri API リファレンス](https://tauri.app/v1/api/js/)
- [React 公式ドキュメント](https://react.dev/)

### **コミュニティ**

- [Tauri Discord](https://discord.com/invite/SpmNs4S)
- [GitHub Repository](https://github.com/tauri-apps/tauri)

---

## 🎯 次のステップ

### **機能拡張のアイデア**

1. **ファイル操作**: Rust での高速ファイル処理
2. **データベース**: SQLite との連携
3. **ネットワーク通信**: HTTP リクエストの処理
4. **暗号化**: Rust の暗号化ライブラリ使用
5. **システム連携**: OS 固有の機能活用

### **パフォーマンス最適化**

1. **並列処理**: Rayon でマルチスレッド処理
2. **メモリ最適化**: スマートポインタの活用
3. **バイナリサイズ削減**: 不要機能の無効化

---

## 🏆 完成したアプリケーションの特徴

✅ **React + Rust の完全統合**  
✅ **型安全な双方向通信**  
✅ **リアルタイムデータ更新**  
✅ **エラーハンドリング**  
✅ **レスポンシブデザイン**  
✅ **開発者体験の最適化**

このプロジェクトは、モダンなデスクトップアプリケーション開発のベストプラクティスを示しています。Web 技術の柔軟性と Rust のパフォーマンスを組み合わせた、次世代のデスクトップアプリケーション開発手法です！

🦀✨ Happy Coding with Rust + React! ✨⚛️
