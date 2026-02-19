# 概要書：Recursive Type Inference を用いた動的モックの実装案

## 1. 背景と目的

現在の `vitest-plugin-gas-mock` は定数値のモックには対応していますが、引数に応じた動的なレスポンス（例：引数の文字列を加工して返す、特定の ID の時だけエラーを投げる等）を定義する手段が不足しています。

本改修では、`@types/google-apps-script` の型定義を最大限に活用し、**「型補完が効くコールバック関数」** を `mockChain` に渡せるアーキテクチャを導入します。

---

## 2. 採用技術：Recursive Type Inference

TypeScript の **Template Literal Types** と **Recursive Conditional Types** を組み合わせ、ドット区切りの文字列パスから GAS の型定義を再帰的に特定します。

### 型定義の実装イメージ

```typescript
/**
 * 文字列パス（"SpreadsheetApp.getActive..."）を分解し、
 * オブジェクト階層から該当する型を抽出するユーティリティ型
 */
type Get<T, P extends string> =
  P extends `\${infer Key}.\${infer Rest}`
    ? Key extends keyof T
      ? Get<T[Key], Rest>
      : never
    : P extends keyof T
      ? T[P]
      : never;

/**
 * GAS の全サービスを統合するレジストリ
 */
interface GasRegistry {
  SpreadsheetApp: GoogleAppsScript.Spreadsheet.SpreadsheetApp;
  DriveApp: GoogleAppsScript.Drive.DriveApp;
  // ... 他のサービスも同様にマッピング
}
```

---

## 3. API の設計 (`mockChain`)

`mockChain` のシグネチャを拡張し、第 2 引数に「値」または「関数」を受け取れるようにします。

```typescript
export function mockChain<
  P extends string,
  Target = Get<GasRegistry, P>
>(
  path: P,
  handler: Target extends (...args: infer Args) => infer R
    ? ((...args: Args) => R | any) | R // 関数、または戻り値そのもの
    : Target // プロパティの場合
): void;
```

---

## 4. ランタイムの実装 (`factory.ts`)

実行時には、登録されたモックが「関数」であるかを判定し、引数を委譲します。

1. **判定**: `typeof overrideValue === 'function'` をチェック。
2. **実行**: 関数であれば、元のメソッド呼び出し時に渡された `arguments` をそのままコールバックに渡し、その戻り値を返却。
3. **フォールバック**: 関数でなければ、従来通り値をそのまま返却。

---

## 5. 開発者体験 (DX) の変化

ユーザーは以下のように、型補完を最大限に享受しながら動的なモックを記述できます。

```typescript
// 'name' は型定義から自動的に string と推論される
mockChain('SpreadsheetApp.getActiveSpreadsheet.setName', (name) => {
  console.log(`Setting name to: \${name}`);
  return `【\${name}】`;
});
```

---

## 6. メリットと考慮事項

| 項目 | 内容 |
| :--- | :--- |
| **保守性** | ビルド時のコード生成が不要。`@types` を更新するだけで最新の GAS API に追随可能。 |
| **利便性** | ユーザーが型アノテーションを書く必要がなく、エディタの補完に身を任せられる。 |
| **制限事項** | 同名で引数構成が異なる「オーバーロード」の場合、TS の仕様上、最初または最後の定義のみが推論対象となる。 |

---
**Document Status**: Proposal / Ready for Implementation
