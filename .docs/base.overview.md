# Design Specification: @cidesjs/vitest-plugin-gasmock

## 1. 概要

`@cidesjs/vitest-plugin-gasmock` は、Google Apps Script (GAS) のローカル開発において、Vitest 環境に GAS のグローバルオブジェクト（SpreadsheetApp, DriveApp等）を自動注入するプラグインです。

`@types/google-apps-script` を解析して構造を自動生成するため、ユーザーは型定義を別途インストールするだけで、実行時のモック環境を手に入れることができます。

---

## 2. コア・コンセプト

1. **Zero-Configuration**: `vitest.config.ts` にプラグインを追加するだけでセットアップ完了。
2. **Structural Impersonation**: 型の厳密さよりも「構造（チェーン）」の再現を優先。
3. **Dynamic Branching**: 深い階層のメソッドも `mockChain` ヘルパーでピンポイントに制御可能。

---

## 3. システムアーキテクチャ

### 3.1. ビルド時（ライブラリ開発者側）

1. **AST Analysis**: `ts-morph` を用いて GAS の型定義から「クラス名」「メソッド名」「戻り値の型（クラス名）」のマップを抽出。
2. **Code Generation**: 抽出したマップを元に、実行時にグローバルオブジェクトを構築するための軽量なメタデータ（または生成済みJSファイル）をビルド資材に含める。

### 3.2. 実行時（ユーザーテスト実行時）

1. **Plugin Injection**: `config` フックにより、Vitest の `setupFiles` に仮想モジュール `virtual:gasmock-setup` を自動追加。
2. **Global Simulation**: 仮想モジュール内で `globalThis` に対して、メソッドチェーンが可能な `vi.fn()` の集合体（Mock Graph）を注入。

---

## 4. 主要コンポーネント設計

### 4.1. モック生成エンジン (`createMock`)

各メソッドにはデフォルトで「次のクラスモックを返す」実装を与えます。

例（擬似コード）:
```typescript
const createMock = (name, returnTypeGetter) => {
  const fn = vi.fn((...args) => {
    if (returnTypeGetter) return returnTypeGetter();
    return undefined;
  });
  fn._gasmock_name = name;
  return fn;
};
```

### 4.2. チェーン制御ヘルパー (`mockChain`)

ユーザーが深い階層の戻り値を上書きするための API です。

```typescript
import { mockChain } from '@cidesjs/vitest-plugin-gasmock';

test('deep chain', () => {
  mockChain(
    SpreadsheetApp,
    'getActiveSpreadsheet.getSheetByName.getRange.getValue',
    'Custom Value'
  );
  // これにより、途中のパスが自動的に繋ぎ直され、末端が 'Custom Value' を返す
});
```

---

## 5. プラグイン実装仕様

### 5.1. Vite プラグイン定義

`vite.config.ts` での使用を想定します。

```typescript
export function gasmockPlugin() {
  return {
    name: 'vite-plugin-gasmock',
    config(config) {
      // 1. setupFiles への自動追加
      // 2. globals: true の強制/推奨設定
    },
    resolveId(id) {
      if (id === 'virtual:gasmock-setup') return '\0' + id;
    },
    load(id) {
      if (id === '\0virtual:gasmock-setup') {
        // ここで生成済みの Mock Graph 構築スクリプトを返す
      }
    }
  };
}
```

---

## 6. ディレクトリ構成案

```text
root/
├── generator/              # 型定義解析スクリプト (ts-morph)
├── src/
│   ├── plugin.ts           # Vite プラグイン実装
│   ├── runtime/
│   │   ├── factory.ts      # createMock 実装
│   │   ├── helpers.ts      # mockChain 実装
│   │   └── generated/      # 解析済みメタデータ
│   └── index.ts            # エントリーポイント
├── package.json
└── tsup.config.ts
```

---

## 7. 利用イメージ

### 7.1. 設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { gasmockPlugin } from '@cidesjs/vitest-plugin-gasmock';

export default defineConfig({
  plugins: [gasmockPlugin()],
});
```

### 7.2. テスト

```typescript
import { it, expect } from 'vitest';

it('should mock GAS deep chains', () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Sheet1');
  
  // 自動的にモックが繋がっている
  expect(sheet).toBeDefined();
  
  // 呼び出し監視も標準の vi.fn() として可能
  expect(ss.getSheetByName).toHaveBeenCalledWith('Sheet1');
});
```
