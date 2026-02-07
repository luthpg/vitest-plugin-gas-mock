/**
 * モックの戻り値をオーバーライドするためのレジストリ
 * キー: "ClassName.methodName" または "ClassName.methodName.chainedMethodName"
 * 値: 返すべき値
 */
const overrideRegistry = new Map<string, any>();

/**
 * 特定のメソッドチェーンの戻り値を指定した値に設定する
 * @param path 文字列によるパス記法 (例: "SpreadsheetApp.getActiveSpreadsheet.getSheetByName")
 * @param value 返すべき値
 */
export function mockChain(path: string, value: any) {
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
