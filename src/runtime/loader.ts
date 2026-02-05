import _enumMap from '../../generated/apps-script-enums.json';
import _classMap from '../../generated/apps-script-map.json';

// 型定義のコピー (analyzer.tsから依存を切るため)
export interface ClassMap {
  [className: string]: {
    methods: {
      [methodName: string]: {
        returnType: string;
        isChainable: boolean;
        overloads?: number;
      };
    };
    properties?: {
      [propertyName: string]: {
        type: string;
        isReadonly: boolean;
      };
    };
  };
}

export interface EnumMap {
  [enumName: string]: {
    namespace: string;
    members: string[];
  };
}

export const classMap = _classMap as unknown as ClassMap;
export const enumMap = _enumMap as unknown as EnumMap;
