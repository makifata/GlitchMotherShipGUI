# React コンポーネントの概念 - 詳細解説

## 目次

1. [コンポーネントとは？](#コンポーネントとは)
2. [関数コンポーネント vs クラスコンポーネント](#関数コンポーネント-vs-クラスコンポーネント)
3. [Props（プロパティ）](#propsプロパティ)
4. [State（状態）](#state状態)
5. [イベントハンドリング](#イベントハンドリング)
6. [ライフサイクルと Hooks](#ライフサイクルとhooks)
7. [コンポーネントの組み合わせ](#コンポーネントの組み合わせ)
8. [実際の例：プログレスバーコンポーネント](#実際の例プログレスバーコンポーネント)

---

## コンポーネントとは？

**コンポーネント**は、React アプリケーションの構築ブロックです。HTML を JavaScript で記述するような形で、再利用可能な UI 要素を作成できます。

### 基本的な考え方

```tsx
// 簡単なコンポーネントの例
function Welcome() {
  return <h1>Hello, World!</h1>;
}
```

### コンポーネントの利点

- **再利用性**: 一度作成したコンポーネントを何度でも使える
- **保守性**: 各コンポーネントが独立しているため、修正が容易
- **可読性**: コードが理解しやすく構造化される
- **テスト性**: 個別にテストしやすい

---

## 関数コンポーネント vs クラスコンポーネント

### 関数コンポーネント（現在の推奨方法）

```tsx
function MyComponent() {
  return <div>Hello!</div>;
}

// またはアロー関数で
const MyComponent = () => {
  return <div>Hello!</div>;
};
```

### クラスコンポーネント（従来の方法）

```tsx
class MyComponent extends React.Component {
  render() {
    return <div>Hello!</div>;
  }
}
```

**現在は関数コンポーネントが推奨されています！**

### なぜ関数コンポーネントが推奨されるのか？

#### 1. **React Hooks の登場（2019 年）**

React 16.8 で Hooks が導入され、関数コンポーネントでもクラスコンポーネントと同じことができるようになりました。

```tsx
// 以前：クラスコンポーネントでしかできなかった
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  componentDidMount() {
    document.title = `Count: ${this.state.count}`;
  }

  componentDidUpdate() {
    document.title = `Count: ${this.state.count}`;
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Increment
        </button>
      </div>
    );
  }
}

// 現在：関数コンポーネント + Hooks で同じことがもっとシンプルに
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]); // countが変更されたときだけ実行

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### 2. **コードがシンプルで読みやすい**

**クラスコンポーネント**：

- `this` の扱いが複雑
- `bind` やアロー関数を使わないとイベントハンドラーが動かない
- ライフサイクルメソッドが分散して書きにくい

```tsx
class ComplexComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      loading: true,
      error: null,
    };
    // bindが必要
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.userId !== prevProps.userId) {
      this.fetchData();
    }
  }

  handleClick() {
    // thisが正しく参照される
    console.log(this.state.data);
  }

  fetchData = async () => {
    // ...複雑な処理
  };

  render() {
    // ...レンダリング
  }
}
```

**関数コンポーネント**：

- `this` を使わない
- より直感的で理解しやすい
- ロジックをカスタム Hooks で分離できる

```tsx
function ComplexComponent({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [userId]); // userIdが変わったときだけ再実行

  const handleClick = () => {
    console.log(data); // thisを使わずに直接アクセス
  };

  const fetchData = async () => {
    // ...処理
  };

  // ...レンダリング
}
```

#### 3. **パフォーマンスの最適化がしやすい**

関数コンポーネントは React の最適化機能をより活用しやすいです：

```tsx
// メモ化によるパフォーマンス最適化
const ExpensiveComponent = React.memo(({ data }) => {
  const expensiveValue = useMemo(() => {
    return data.map(item => item.value * 1000).reduce((a, b) => a + b, 0);
  }, [data]); // dataが変わったときだけ再計算

  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []); // 一度だけ作成され、再作成されない

  return <div>{expensiveValue}</div>;
});
```

#### 4. **React チームの方針**

- **Facebook/Meta の React チーム**は関数コンポーネント + Hooks を推奨
- **新機能**は関数コンポーネント向けに開発される
- **React 18 の新機能**（Concurrent Mode など）も関数コンポーネントで最適化
- **将来性**：今後の React の発展は関数コンポーネント中心

#### 5. **学習コストが低い**

```tsx
// 学習が必要なクラスコンポーネントの概念
class MyComponent extends React.Component {
  // constructor, super, this, bindの理解が必要
  // ライフサイクルメソッドの理解が必要
  // ES6 Classの知識が必要
}

// よりシンプルな関数コンポーネント
function MyComponent() {
  // JavaScriptの関数の知識があれば理解しやすい
  // useStateやuseEffectという直感的な名前
}
```

#### 6. **テストが書きやすい**

```tsx
// 関数コンポーネントは純粋関数に近いのでテストしやすい
import { render, fireEvent, screen } from '@testing-library/react';
import Counter from './Counter';

test('increments counter', () => {
  render(<Counter />);
  const button = screen.getByText('Increment');
  fireEvent.click(button);
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

#### 7. **カスタム Hooks で機能を分離**

関数コンポーネントなら、ロジックをカスタム Hooks として切り出せます：

```tsx
// カスタムHook: プログレスバーのロジックを分離
function useProgressBar(duration = 3000) {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const start = useCallback(() => {
    if (isAnimating) return;

    setProgress(0);
    setIsAnimating(true);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(timer);
          setIsAnimating(false);
        }
        return next;
      });
    }, duration / 100);
  }, [duration, isAnimating]);

  const reset = useCallback(() => {
    setProgress(0);
    setIsAnimating(false);
  }, []);

  return { progress, isAnimating, start, reset };
}

// コンポーネントはUIだけに集中
function ProgressBarComponent({ duration }) {
  const { progress, isAnimating, start, reset } = useProgressBar(duration);

  return (
    <div>
      <button onClick={start} disabled={isAnimating}>
        {isAnimating ? 'アニメーション中...' : 'スタート'}
      </button>
      <button onClick={reset} disabled={isAnimating}>
        リセット
      </button>
      <div style={{ width: `${progress}%` }}>Progress</div>
    </div>
  );
}
```

### 結論：時代は完全に関数コンポーネント

- **2024 年現在**：新しい React プロジェクトは 99%関数コンポーネント
- **求人市場**：React 開発者の求人は Hooks の知識が必須
- **コミュニティ**：チュートリアル、ライブラリ、すべて関数コンポーネント前提
- **React 公式ドキュメント**：関数コンポーネントがメイン

クラスコンポーネントは**レガシーコード**として残りますが、新規開発では関数コンポーネント一択です！

---

## Props（プロパティ）

Props は、親コンポーネントから子コンポーネントにデータを渡すための仕組みです。

### 基本的な使い方

```tsx
// 子コンポーネント
interface GreetingProps {
  name: string;
  age?: number; // オプショナル
}

function Greeting({ name, age }: GreetingProps) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age && <p>You are {age} years old.</p>}
    </div>
  );
}

// 親コンポーネント
function App() {
  return (
    <div>
      <Greeting name="Alice" age={25} />
      <Greeting name="Bob" />
    </div>
  );
}
```

### プログレスバーコンポーネントでの Props 例

```tsx
interface ProgressBarComponentProps {
  duration?: number; // アニメーションの時間
  className?: string; // CSSクラス
}

const ProgressBarComponent: React.FC<ProgressBarComponentProps> = ({
  duration = 3000, // デフォルト値
  className = '',
}) => {
  // コンポーネントの実装
};
```

---

## State（状態）

State は、コンポーネント内部で管理されるデータです。State が変更されると、コンポーネントが再レンダリングされます。

### useState フック

```tsx
import React, { useState } from 'react';

function Counter() {
  // [現在の値, 更新関数] = useState(初期値)
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}
```

### プログレスバーでの State 例

```tsx
function ProgressBarComponent() {
  const [progress, setProgress] = useState(0); // 進行状況
  const [isAnimating, setIsAnimating] = useState(false); // アニメーション状態

  const startProgress = () => {
    setIsAnimating(true);
    // プログレスバーのアニメーション開始
  };

  return (
    <div>
      <button onClick={startProgress} disabled={isAnimating}>
        {isAnimating ? 'アニメーション中...' : 'スタート'}
      </button>
      <div style={{ width: `${progress}%` }}>Progress Bar</div>
    </div>
  );
}
```

---

## イベントハンドリング

ユーザーの操作（クリック、入力など）に反応する仕組みです。

### 基本的なイベントハンドリング

```tsx
function Button() {
  const handleClick = () => {
    alert('Button clicked!');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### 複数のイベントハンドラー

```tsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // デフォルトの動作を防ぐ
    console.log('Login:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## ライフサイクルと Hooks

### useEffect フック

コンポーネントのマウント、アップデート、アンマウント時に処理を実行できます。

```tsx
import React, { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // コンポーネントマウント時に実行
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // クリーンアップ関数（アンマウント時に実行）
    return () => clearInterval(interval);
  }, []); // 空の依存配列 = 一回だけ実行

  return <div>Timer: {seconds}s</div>;
}
```

### よく使われる Hooks

```tsx
function ExampleComponent() {
  // 状態管理
  const [count, setCount] = useState(0);

  // 副作用
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  // メモ化（パフォーマンス最適化）
  const expensiveValue = useMemo(() => {
    return count * 1000;
  }, [count]);

  // コールバックのメモ化
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Expensive: {expensiveValue}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}
```

---

## コンポーネントの組み合わせ

複数のコンポーネントを組み合わせて複雑な UI を構築します。

### コンポーネント構成の例

```tsx
// 小さなコンポーネント
function Button({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return <button onClick={onClick}>{children}</button>;
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// これらを組み合わせた大きなコンポーネント
function TodoApp() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  return (
    <div>
      <h1>Todo App</h1>
      <div>
        <Input value={input} onChange={setInput} placeholder="Add a todo..." />
        <Button onClick={addTodo}>Add</Button>
      </div>
      <ul>
        {todos.map((todo, index) => (
          <li key={index}>{todo}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 実際の例：プログレスバーコンポーネント

今回作成したプログレスバーコンポーネントを詳しく分析してみましょう。

### コンポーネントの構造

```tsx
interface ProgressBarComponentProps {
  duration?: number; // Props: 外部から設定可能
  className?: string;
}

const ProgressBarComponent: React.FC<ProgressBarComponentProps> = ({
  duration = 3000,
  className = '',
}) => {
  // State: 内部状態の管理
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // イベントハンドラー: ユーザー操作への反応
  const startProgress = () => {
    if (isAnimating) return;

    setProgress(0);
    setIsAnimating(true);

    // アニメーションロジック
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

  // JSX: UIの構造
  return (
    <div className={`progress-bar-container ${className}`}>
      {/* ヘッダー部分 */}
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

      {/* プログレスバー本体 */}
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }} // 動的スタイル
          />
        </div>
        <div className="progress-text">{progress}%</div>
      </div>

      {/* インラインスタイル */}
      <style>{`/* CSS styles here */`}</style>
    </div>
  );
};
```

### このコンポーネントの重要な概念

1. **Props（プロパティ）**

   - `duration`: アニメーション時間を外部から指定可能
   - `className`: 追加の CSS クラスを適用可能

2. **State（状態）**

   - `progress`: 現在の進行状況（0-100）
   - `isAnimating`: アニメーション実行中かどうか

3. **イベントハンドリング**

   - `startProgress`: スタートボタンクリック時の処理
   - `resetProgress`: リセットボタンクリック時の処理

4. **条件付きレンダリング**

   - ボタンのテキストや無効化状態を状態に応じて変更

5. **動的スタイリング**
   - プログレスバーの幅を`progress`状態に応じて変更

---

## まとめ

React コンポーネントは以下の要素で構成されています：

- **Props**: 外部から受け取るデータ
- **State**: 内部で管理する状態
- **イベントハンドラー**: ユーザー操作への反応
- **JSX**: UI の構造とレンダリング
- **Hooks**: 状態管理や副作用の処理

これらの概念を組み合わせることで、インタラクティブで再利用可能な UI コンポーネントを作成できます。

プログレスバーコンポーネントは、これらすべての概念を含んだ実用的な例となっています！
