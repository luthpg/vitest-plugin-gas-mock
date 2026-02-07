import _gasMap from '../../generated/map.json';

// 型定義のコピー (analyzer.tsから依存を切るため)
export interface MapEntry {
  kind: 'class' | 'enum';
  methods?: {
    [methodName: string]: {
      returnType: string;
      isChainable: boolean;
      overloads?: number;
      isIterable?: boolean;
    };
  };
  properties?: {
    [propertyName: string]: {
      type: string;
      isReadonly: boolean;
    };
  };
  members?: Record<string, string | number>; // Enum用
}

export interface GasMap {
  [name: string]: MapEntry;
}

export const classMap = _gasMap as unknown as GasMap;
