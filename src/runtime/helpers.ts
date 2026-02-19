/**
 * モックの戻り値をオーバーライドするためのレジストリ
 * キー: "ClassName.methodName" または "ClassName.methodName.chainedMethodName"
 * 値: 返すべき値
 */
import type { DeepPartial, GasRegistry, Get } from './types';

/**
 * モックの戻り値をオーバーライドするためのレジストリ
 * キー: "ClassName.methodName" または "ClassName.methodName.chainedMethodName"
 * 値: 返すべき値
 */
const overrideRegistry = new Map<string, any>();

/**
 * 特定のメソッドチェーンの戻り値を指定した値に設定する
 * @param path 文字列によるパス記法 (例: "SpreadsheetApp.getActiveSpreadsheet.getSheetByName")
 * @param value 返すべき値、または値を返す関数
 */
export function mockChain<P extends string, Target = Get<GasRegistry, P>>(
  path: P,
  value: Target extends (...args: infer Args) => infer R
    ? ((...args: Args) => DeepPartial<R>) | DeepPartial<R>
    : DeepPartial<Target> | any,
) {
  overrideRegistry.set(path, value);
}

/**
 * オーバーライドされた値を取得する
 */
export function getOverride(path: string): {
  hasOverride: boolean;
  value: any;
} {
  if (overrideRegistry.has(path)) {
    return { hasOverride: true, value: overrideRegistry.get(path) };
  }
  return { hasOverride: false, value: undefined };
}

/**
 * レジストリをクリアする（テスト間の分離用）
 */
export function clearMocks() {
  overrideRegistry.clear();
}
