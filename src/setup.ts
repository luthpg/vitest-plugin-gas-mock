import { createMock } from './runtime/factory';
import { classMap, enumMap } from './runtime/loader';

// グローバルを汚染すると危険なクラス名を除外
const blacklist = new Set([
  'Date',
  'Math',
  'JSON',
  'Object',
  'Function',
  'Array',
  'String',
  'Number',
  'Boolean',
  'RegExp',
  'Error',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Symbol',
  'Proxy',
  'Reflect',
  'Element',
  'Event',
  'Node',
  'Document',
  'Window',
  'console',
]);

// ClassMapにあるすべてのキーをグローバルに展開
Object.keys(classMap).forEach((className) => {
  if (blacklist.has(className)) return;

  if (!(className in globalThis)) {
    (globalThis as Record<string, unknown>)[className] = createMock(
      className,
      className,
    );
  }
});

// Enumの注入
Object.keys(enumMap).forEach((enumName) => {
  const members = enumMap[enumName].members;
  const enumObj: Record<string, string> = {};
  members.forEach((m) => {
    enumObj[m] = `${enumName}_${m}`;
  });

  if (!(enumName in globalThis)) {
    (globalThis as Record<string, unknown>)[enumName] = enumObj;
  }
});
