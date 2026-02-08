import _gasMap from '../../generated/map.json' with { type: 'json' };

// 型定義のコピー (analyzer.tsから依存を切るため)
export interface MapEntry {
  k: 'c' | 'e'; // kind (class | enum)
  m?: {
    [methodName: string]: {
      rt: string; // returnType
      ic?: 1; // isChainable (omit if false)
      ol?: number; // overloads (omit if 1)
      ii?: 1; // isIterable (omit if false)
      d?: number; // dimensions (omit if 0)
    };
  };
  p?: {
    [propertyName: string]: {
      t: string; // type
      ir?: 1; // isReadonly (omit if false)
    };
  };
  v?: Record<string, string | number>; // members (Enum用)
}

export interface GasMap {
  [name: string]: MapEntry;
}

export const classMap = _gasMap as unknown as GasMap;
