import { createMock } from './runtime/factory';
import { classMap } from './runtime/loader';

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
Object.keys(classMap).forEach((name) => {
  if (blacklist.has(name)) return;

  if (!(name in globalThis)) {
    (globalThis as Record<string, unknown>)[name] = createMock(name, name);
  }
});
