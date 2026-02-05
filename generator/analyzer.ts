import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type InterfaceDeclaration,
  type ModuleDeclaration,
  Project,
  type TypeNode,
} from 'ts-morph';

// 出力ディレクトリ
const GENERATED_DIR = path.resolve(__dirname, '../generated');
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR);
}

// 解析結果のマップ
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

const classMap: ClassMap = {};
const enumMap: EnumMap = {};

// TypeScriptプロジェクトの初期化
console.log('🔍 Initializing ts-morph project...');
const project = new Project({
  compilerOptions: {
    target: 99,
    strict: true,
  },
});

// node_modules/@types/google-apps-script 以下の型定義ファイルを読み込む
project.addSourceFilesAtPaths(
  'node_modules/@types/google-apps-script/**/*.d.ts',
);

const sourceFiles = project.getSourceFiles();
console.log(`files found: ${sourceFiles.length}`);

// 型名を簡略化するヘルパー関数
function simplifyTypeName(typeText: string): string {
  const parts = typeText.split('.');
  let simplifiedName = parts[parts.length - 1];

  simplifiedName = simplifiedName.replace(/\[\]/g, '');
  simplifiedName = simplifiedName.replace(/Promise<(.+)>/g, '$1');
  simplifiedName = simplifiedName.replace(/ \| null/g, '');
  simplifiedName = simplifiedName.replace(/ \| undefined/g, '');

  return simplifiedName;
}

/**
 * 戻り値の型を解析する
 */
const analyzeReturnType = (
  typeNode: TypeNode,
  gasInterfaceNames: Set<string>,
) => {
  const fullText = typeNode.getText();
  const typeName = simplifyTypeName(fullText);

  const isChainable = gasInterfaceNames.has(typeName);

  return { typeName, isChainable };
};

export const generateGasMap = async () => {
  // GoogleAppsScript 名前空間を探す (複数ファイルに分散)
  const gasNamespaces = project
    .getSourceFiles()
    .flatMap((sf) => sf.getModules())
    .filter((m) => m.getName() === 'GoogleAppsScript');

  if (gasNamespaces.length === 0) {
    console.error('❌ GoogleAppsScript namespace not found!');
    return;
  }

  const allInterfaces: InterfaceDeclaration[] = [];

  const collectDeclarations = (
    node: ModuleDeclaration,
    namespacePath: string,
  ) => {
    const interfaces = node.getInterfaces?.();
    if (interfaces) {
      allInterfaces.push(...interfaces);
    }

    const enums = node.getEnums?.();
    if (enums) {
      for (const enumDecl of enums) {
        const enumName = enumDecl.getName();
        const members = enumDecl.getMembers().map((m) => m.getName());
        enumMap[enumName] = {
          namespace: namespacePath,
          members,
        };
      }
    }

    const modules = node.getModules?.();
    if (modules) {
      for (const subModule of modules) {
        const subPath = namespacePath
          ? `${namespacePath}.${subModule.getName()}`
          : subModule.getName();
        collectDeclarations(subModule, subPath);
      }
    }
  };

  for (const ns of gasNamespaces) {
    collectDeclarations(ns, '');
  }

  console.log(
    `🧩 Found ${allInterfaces.length} interfaces and ${Object.keys(enumMap).length} enums. Analyzing relationships...`,
  );

  const gasInterfaceNames = new Set(allInterfaces.map((i) => i.getName()));

  for (const interfaceDecl of allInterfaces) {
    const className = interfaceDecl.getName();

    if (className === 'Integer' || className === 'Byte') continue;

    if (!classMap[className]) {
      classMap[className] = { methods: {} };
    }

    if (className === 'Spreadsheet') {
      // デバッグログ
      console.log(
        `DEBUG: Spreadsheet found in ${interfaceDecl.getSourceFile().getFilePath()} (Methods: ${interfaceDecl.getMethods().length})`,
      );
    }

    const properties = interfaceDecl.getProperties();
    if (properties.length > 0) {
      if (!classMap[className].properties) {
        classMap[className].properties = {};
      }
      for (const prop of properties) {
        const propName = prop.getName();
        const propType = prop.getType().getText();
        const isReadonly = prop.isReadonly();

        classMap[className].properties[propName] = {
          type: simplifyTypeName(propType),
          isReadonly,
        };
      }
    }

    // メソッドマージ
    const methodsMap = new Map<
      string,
      { returnType: string; isChainable: boolean; count: number }
    >();

    if (classMap[className].methods) {
      for (const [name, info] of Object.entries(classMap[className].methods)) {
        methodsMap.set(name, {
          returnType: info.returnType,
          isChainable: info.isChainable,
          count: info.overloads || 1,
        });
      }
    }

    for (const method of interfaceDecl.getMethods()) {
      const methodName = method.getName();
      const returnTypeNode = method.getReturnTypeNode();
      if (!returnTypeNode) continue;
      const { typeName, isChainable } = analyzeReturnType(
        returnTypeNode,
        gasInterfaceNames,
      );

      const existing = methodsMap.get(methodName);
      if (existing) {
        existing.count++;
      } else {
        methodsMap.set(methodName, {
          returnType: typeName,
          isChainable,
          count: 1,
        });
      }
    }

    const methodsObj: ClassMap[string]['methods'] = {};
    for (const [name, info] of methodsMap.entries()) {
      methodsObj[name] = {
        returnType: info.returnType,
        isChainable: info.isChainable,
        ...(info.count > 1 && { overloads: info.count }),
      };
    }
    classMap[className].methods = methodsObj;
  }

  const outputPath = path.join(GENERATED_DIR, 'apps-script-map.json');
  fs.writeFileSync(outputPath, JSON.stringify(classMap, null, 2));
  console.log(`✅ Map generated at ${outputPath}`);

  const enumsOutputPath = path.join(GENERATED_DIR, 'apps-script-enums.json');
  fs.writeFileSync(enumsOutputPath, JSON.stringify(enumMap, null, 2));
  console.log(`✅ Enums generated at ${enumsOutputPath}`);
};
