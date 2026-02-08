import { vi } from 'vitest';
import { getOverride } from './helpers';
import { classMap } from './loader';

/**
 * 指定されたクラス名のモックオブジェクト（Proxy）を生成する
 * @param className GASのクラス名 (e.g., "SpreadsheetApp", "Sheet")
 * @param currentPath 現在のメソッドチェーンのパス (e.g., "SpreadsheetApp.getActiveSpreadsheet")
 */
export function createMock<T = any>(
  className: string,
  currentPath?: string,
): T {
  const path = currentPath || className;
  let classDef = classMap[className];
  let actualClassName = className;

  // 定義が見つからない場合は FQN での検索を試みる
  if (!classDef) {
    const potentialFullMatches = Object.keys(classMap).filter((k) =>
      k.endsWith(`.${className}`),
    );

    if (potentialFullMatches.length >= 1) {
      // path からサービス名を推測して優先順位をつける
      const serviceMatch = path.match(
        /^(Spreadsheet|Document|Slides|Form|Gmail|Drive|Calendar)App/,
      );
      if (serviceMatch) {
        const serviceName = serviceMatch[1];
        const fqn = `${serviceName}.${className}`;
        if (classMap[fqn]) {
          actualClassName = fqn;
        } else {
          actualClassName = potentialFullMatches[0];
        }
      } else {
        // 特殊な推測ができない場合は、Spreadsheet を優先的に探してみる（最も一般的なため）
        const spreadsheetFqn = `Spreadsheet.${className}`;
        if (classMap[spreadsheetFqn]) {
          actualClassName = spreadsheetFqn;
        } else {
          actualClassName = potentialFullMatches[0];
        }
      }
      classDef = classMap[actualClassName];
    }
  }

  // 定義が存在しない場合は汎用的なモックを返す
  if (!classDef) {
    return new Proxy(vi.fn(), {
      get: (target, prop, receiver) => {
        if (typeof prop === 'string') {
          // 特殊なプロパティへのアクセスは無視
          if (prop === 'then' || prop === 'toJSON') {
            return Reflect.get(target, prop, receiver);
          }
          // すでにclassNameに含まれているか、pathに基づいて探索を試みるための
          // fallbackとして単純にprop名でcreateMockを呼び出す
          return createMock(prop, `${path}.${prop}`);
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as unknown as T;
  }

  // Enumの場合は値をそのまま返す
  if (classDef.kind === 'enum' && classDef.members) {
    // Enum自体が個別の値として読み込まれる場合
    return classDef.members as unknown as T;
  }

  const target = vi.fn();
  const proxy = new Proxy(target, {
    get: (target, prop, receiver) => {
      // シンボルや特殊なプロパティへのアクセスは無視
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON') {
        return Reflect.get(target, prop, receiver);
      }

      const paramName = String(prop);

      // 1. プロパティ定義にあるか確認
      if (classDef.properties?.[paramName]) {
        const propType = classDef.properties[paramName].type;
        return resolveReturnValue(propType, `${path}.${paramName}`);
      }

      // 2. Enumメンバーか確認 (analyzerでmembersが抽出されている場合)
      if (classDef.members && paramName in classDef.members) {
        return classDef.members[paramName];
      }

      // 3. メソッドか確認
      if (classDef.methods?.[paramName]) {
        const methodDef = classDef.methods[paramName];

        // すでに値がセットされていればそれを返す
        if (Reflect.has(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }

        const mockFn = vi.fn((..._args: unknown[]) => {
          // 現在のパスを計算
          const nextPath = `${path}.${paramName}`;

          // オーバーライドを確認
          const override = getOverride(nextPath);
          if (override.hasOverride) {
            return override.value;
          }

          // メソッド実行時の戻り値
          if (methodDef.returnType) {
            if (methodDef.returnType === 'void') {
              return undefined;
            }
            const dims = methodDef.dimensions || (methodDef.isIterable ? 1 : 0);
            const baseValue = resolveReturnValue(
              methodDef.returnType,
              nextPath,
            );

            let result = baseValue;
            for (let i = 0; i < dims; i++) {
              result = [result];
            }
            return result;
          }

          return undefined; // void or no return type
        });

        // モック名を設定（デバッグ用）
        mockFn.mockName(nextPath(path, paramName));

        (target as any)[paramName] = mockFn;
        return mockFn;
      }

      // 4. ネストされたクラスやEnumの可能性を考慮してcreateMockを再帰的に呼ぶ
      // classNameを "Parent.Child" 形式で探してみる
      const nestedClassName = `${actualClassName}.${paramName}`;
      if (classMap[nestedClassName]) {
        return createMock(nestedClassName, `${path}.${paramName}`);
      }

      // 5. 定義にないプロパティ
      return Reflect.get(target, prop, receiver);
    },

    apply: () => undefined,
  });

  return proxy as unknown as T;
}

function nextPath(path: string, paramName: string): string {
  return `${path}.${paramName}`;
}

/**
 * 戻り値の型名から実際の値を解決する
 */
function resolveReturnValue(type: string, path: string): unknown {
  const normalizedType = type.toLowerCase();

  // 1. プリミティブ型のデフォルト値
  if (
    normalizedType === 'number' ||
    normalizedType === 'integer' ||
    normalizedType === 'byte'
  ) {
    return 0;
  }
  if (normalizedType === 'string') {
    return '';
  }
  if (normalizedType === 'boolean') {
    return false;
  }
  if (normalizedType === 'void') {
    return undefined;
  }
  if (normalizedType === 'date') {
    return new Date();
  }
  if (normalizedType === 'object' || normalizedType === 'any') {
    return {};
  }
  // オブジェクトリテラル型 (e.g. { [key: string]: string })
  if (normalizedType.startsWith('{')) {
    return {};
  }

  // 2. クラスMapに定義がある場合はそのクラスのモックを作成
  if (classMap[type]) {
    return createMock(type, path);
  }

  // 3. FQN での検索 (名前空間衝突回避されたクラス用)
  // path (e.g. SpreadsheetApp.getActiveSpreadsheet.getRange) から
  // 適切な名前空間を推測してみる
  const serviceMatch = path.match(
    /^(Spreadsheet|Document|Slides|Form|Gmail|Drive|Calendar)App/,
  );
  if (serviceMatch) {
    const serviceName = serviceMatch[1];
    const fqn = `${serviceName}.${type}`;
    if (classMap[fqn]) {
      return createMock(fqn, path);
    }
  }

  // 推測できない場合は最初に見つかった FQN を使用
  const potentialFullMatches = Object.keys(classMap).filter((k) =>
    k.endsWith(`.${type}`),
  );
  if (potentialFullMatches.length >= 1) {
    return createMock(potentialFullMatches[0], path);
  }

  // 4. それ以外は汎用的なモックを返す
  return createMock(type, path);
}
