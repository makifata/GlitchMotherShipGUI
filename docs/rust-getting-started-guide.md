# Rust プログラミング言語 - スタートガイド

## 🎉 インストール完了！

Rust が正常にインストールされました：

- **Rust コンパイラ**: `rustc 1.90.0`
- **Cargo パッケージマネージャ**: `cargo 1.90.0`
- **サンプルプロジェクト**: `hello_rust` が作成され、正常に実行されました！

---

## 📁 インストール場所

### Rust ツールチェーン

```
C:\Users\miz\.rustup\       # Rust ツールチェーンの管理
C:\Users\miz\.cargo\        # Cargo とパッケージ
C:\Users\miz\.cargo\bin\    # 実行ファイル (PATH に追加済み)
```

### 主要コマンド

- `rustc`: Rust コンパイラ
- `cargo`: パッケージマネージャ・ビルドツール
- `rustup`: Rust バージョン管理
- `rustfmt`: コードフォーマッター
- `clippy`: 静的解析ツール

---

## 🚀 Rust の基本

### 1. **新しいプロジェクトの作成**

```bash
# バイナリ（実行ファイル）プロジェクト
cargo new my_project --bin

# ライブラリプロジェクト
cargo new my_library --lib

# プロジェクトディレクトリに移動
cd my_project
```

### 2. **プロジェクト構造**

```
my_project/
├── Cargo.toml          # プロジェクト設定ファイル
├── src/
│   └── main.rs         # メインのソースコード
└── target/             # ビルド成果物（自動生成）
```

### 3. **基本的なコマンド**

```bash
cargo build          # プロジェクトをビルド
cargo run            # ビルドして実行
cargo check          # コンパイルチェック（実行ファイルは作らない）
cargo test           # テストを実行
cargo clean          # ビルド成果物を削除
```

---

## 💻 Rust コードの例

### Hello World (すでに作成済み)

```rust
// src/main.rs
fn main() {
    println!("Hello, world!");
}
```

### より実践的な例

#### **変数と型**

```rust
fn main() {
    // 不変変数 (immutable)
    let name = "Rust";
    let age = 15; // 2009年から開発開始

    // 可変変数 (mutable)
    let mut score = 100;
    score += 50;

    println!("言語: {}, 年齢: {}年, スコア: {}", name, age, score);
}
```

#### **関数**

```rust
fn main() {
    let result = add(10, 20);
    println!("結果: {}", result);

    greet("太郎");
}

fn add(a: i32, b: i32) -> i32 {
    a + b  // return は省略可能
}

fn greet(name: &str) {
    println!("こんにちは, {}さん!", name);
}
```

#### **構造体とメソッド**

```rust
struct Person {
    name: String,
    age: u32,
}

impl Person {
    // 関連関数（コンストラクタ的な使い方）
    fn new(name: String, age: u32) -> Person {
        Person { name, age }
    }

    // メソッド
    fn greet(&self) {
        println!("私は{}で、{}歳です", self.name, self.age);
    }

    // 誕生日メソッド
    fn birthday(&mut self) {
        self.age += 1;
    }
}

fn main() {
    let mut person = Person::new("太郎".to_string(), 25);
    person.greet();

    person.birthday();
    person.greet();
}
```

#### **エラーハンドリング**

```rust
use std::fs::File;
use std::io::prelude::*;

fn read_file(filename: &str) -> Result<String, std::io::Error> {
    let mut file = File::open(filename)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

fn main() {
    match read_file("example.txt") {
        Ok(contents) => println!("ファイルの中身: {}", contents),
        Err(error) => println!("エラー: {}", error),
    }
}
```

---

## 📚 Rust の特徴

### 🔒 **メモリ安全性**

- **所有権システム**: メモリリークやダングリングポインタを防ぐ
- **ガベージコレクション不要**: 高いパフォーマンス
- **コンパイル時チェック**: 実行時エラーを防ぐ

### ⚡ **パフォーマンス**

- **ゼロコスト抽象化**: 抽象化によるオーバーヘッドなし
- **C/C++ 並みの速度**: システムプログラミングに最適
- **並行プログラミング**: 安全な並行処理

### 🛠️ **開発体験**

- **Cargo**: 優秀なパッケージマネージャ
- **rustfmt**: 自動コードフォーマット
- **clippy**: 詳細な静的解析
- **豊富なドキュメント**: `cargo doc` で生成

---

## 🎯 Rust の用途

### **システムプログラミング**

- オペレーティングシステム
- デバイスドライバ
- 組み込みシステム

### **Web 開発**

```rust
// Webフレームワーク例
use actix_web::{web, App, HttpServer, Responder};

async fn hello() -> impl Responder {
    "Hello, Rust Web!"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new().route("/", web::get().to(hello))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

### **CLI ツール**

- `ripgrep`: 高速 grep 代替
- `bat`: cat 代替
- `exa`: ls 代替
- `fd`: find 代替

### **ブロックチェーン・仮想通貨**

- Solana
- Polkadot
- 多くの DeFi プロトコル

---

## 🆚 他言語との比較

| 特徴               | Rust                | C/C++       | Go        | JavaScript |
| ------------------ | ------------------- | ----------- | --------- | ---------- |
| **メモリ安全性**   | ✅ コンパイル時保証 | ❌ 手動管理 | ✅ GC     | ✅ GC      |
| **パフォーマンス** | ⚡ 超高速           | ⚡ 超高速   | 🚀 高速   | 🐌 中程度  |
| **学習コスト**     | 🔴 高い             | 🔴 高い     | 🟡 中程度 | 🟢 低い    |
| **エコシステム**   | 🟡 成長中           | 🟢 成熟     | 🟡 成長中 | 🟢 巨大    |
| **コンパイル時間** | 🐌 遅い             | 🚀 速い     | ⚡ 超高速 | -          |

---

## 📖 学習リソース

### **公式リソース**

- [The Rust Book](https://doc.rust-lang.org/book/) - 公式チュートリアル
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - 実例集
- [Rustlings](https://github.com/rust-lang/rustlings) - 演習問題

### **日本語リソース**

- [プログラミング言語 Rust 入門](https://zenn.dev/mebiusbox/books/22d4c1ed9b0003)
- [Rust 入門](https://zenn.dev/toga/books/rust-basics)

### **実践プロジェクト**

```bash
# CLI ツールを作ってみる
cargo new my_cli_tool --bin
cd my_cli_tool

# 依存関係の追加 (Cargo.toml)
[dependencies]
clap = "4.0"  # コマンドライン引数パーサー
serde = { version = "1.0", features = ["derive"] }  # シリアライゼーション
```

---

## 🔧 開発環境の設定

### **VS Code 拡張機能**

1. **rust-analyzer**: 必須の Rust IDE 機能
2. **CodeLLDB**: デバッグ機能
3. **Better TOML**: Cargo.toml 編集支援

### **設定コマンド**

```bash
# 最新版に更新
rustup update

# 特定バージョンのインストール
rustup install 1.89.0

# コンポーネントの追加
rustup component add clippy rustfmt

# ターゲットの追加（クロスコンパイル用）
rustup target add wasm32-unknown-unknown
```

---

## 🎉 次のステップ

### **1. 基本文法の習得**

- 所有権システムの理解
- パターンマッチング
- エラーハンドリング

### **2. 実践プロジェクト**

- 簡単な CLI ツール作成
- Web アプリケーション（actix-web）
- WebAssembly アプリ

### **3. コミュニティ参加**

- [Rust Users Forum](https://users.rust-lang.org/)
- [r/rust](https://www.reddit.com/r/rust/)
- Rust 勉強会・イベント

---

## 🚀 今すぐ試せる例

作成済みの `hello_rust` プロジェクトを編集してみましょう：

```bash
cd hello_rust
```

`src/main.rs` を以下のように変更：

```rust
fn main() {
    let languages = vec!["Rust", "JavaScript", "TypeScript", "React"];

    println!("学習中の技術:");
    for (index, lang) in languages.iter().enumerate() {
        println!("{}. {}", index + 1, lang);
    }

    let rust_score = calculate_awesome_score("Rust");
    println!("\nRustの素晴らしさ: {}点/100点", rust_score);
}

fn calculate_awesome_score(language: &str) -> u32 {
    match language {
        "Rust" => 100,
        "JavaScript" | "TypeScript" => 85,
        _ => 70,
    }
}
```

実行：

```bash
cargo run
```

Rust プログラミングの世界へようこそ！🦀
