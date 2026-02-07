import { vi } from 'vitest';
import { getOverride } from './helpers';
import { classMap } from './loader';

/**
 * 指定されたクラス名のモックオブジェクト（Proxy）を生成する
 * @param className GASのクラス名 (e.g., "SpreadsheetApp", "Sheet")
 * @param currentPath 現在のメソッドチェーンのパス (e.g., "SpreadsheetApp.getActiveSpreadsheet")
 */
export function createMock(className: string, currentPath?: string): any {
  // 定義が存在しない場合は汎用的なモックを返す
  const classDef = classMap[className];

  // Enumの場合は値をそのまま返す
  if (classDef?.kind === 'enum' && classDef.members) {
    const enumObj: any = {};
    for (const [memberName, memberValue] of Object.entries(classDef.members)) {
      enumObj[memberName] = memberValue ?? memberName;
    }
    return enumObj;
  }

  // ターゲットは空の関数
  const target = () => {};

  // Enumメンバーがあれば追加
  if (classDef?.members) {
    for (const [memberName, memberValue] of Object.entries(classDef.members)) {
      (target as any)[memberName] = memberValue ?? memberName;
    }
  }

  const proxy = new Proxy(target, {
    get: (target, prop, receiver) => {
      // シンボルや特殊なプロパティへのアクセスは無視
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON') {
        return Reflect.get(target, prop, receiver);
      }

      const paramName = prop as string;

      // 1. プロパティ定義にあるか確認
      if (classDef?.properties?.[paramName]) {
        const propType = classDef.properties[paramName].type;
        // プロパティの場合はパスを更新しない（あるいはプロパティ名を含めるか要検討だが、メソッドチェーン主眼なので一旦無視）
        return resolveReturnValue(propType, undefined);
      }

      // 2. メソッド定義にあるか確認
      if (classDef?.methods?.[paramName]) {
        const methodDef = classDef.methods[paramName];

        // すでに値がセットされていればそれを返す
        if (Reflect.has(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }

        const mockFn = vi.fn((..._args: any[]) => {
          // 現在のパスを計算
          // ClassName.methodName という形式にする
          // ルートの場合は className がセットされているはず
          const nextPath = currentPath
            ? `${currentPath}.${paramName}`
            : `${className}.${paramName}`;

          // オーバーライドを確認
          const override = getOverride(nextPath);
          if (override.hasOverride) {
            return override.value;
          }

          // メソッド実行時の戻り値
          if (methodDef.isChainable && methodDef.returnType) {
            return createMock(methodDef.returnType, nextPath);
          }
          return undefined; // void or primitive
        });

        // モック名を設定（デバッグ用）
        mockFn.mockName(
          currentPath
            ? `${currentPath}.${paramName}`
            : `${className}.${paramName}`,
        );

        (target as any)[paramName] = mockFn;
        return mockFn;
      }

      // 3. 定義にないプロパティ
      return Reflect.get(target, prop, receiver);
    },

    apply: () => undefined,
  });

  return proxy;
}

/**
 * 戻り値の型名から実際の値を解決する
 */
function resolveReturnValue(typeName: string, childPath?: string): any {
  // 基本型
  if (typeName === 'string') return '';
  if (typeName === 'number') return 0;
  if (typeName === 'boolean') return false;
  if (typeName === 'void') return undefined;

  // GASクラス型ならモックを返す
  if (classMap[typeName]) {
    return createMock(typeName, childPath);
  }

  return undefined;
}
