import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('factory logic (mocked)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should handle capitalized primitives from MapEntry', async () => {
    vi.doMock('../../src/runtime/loader', () => ({
      __esModule: true,
      classMap: {
        MockClass: {
          kind: 'class',
          methods: { getVal: { returnType: 'Number', isChainable: false } },
        },
      },
    }));
    const { createMock } = await import('../../src/runtime/factory');
    const mock = createMock('MockClass');
    expect(mock.getVal()).toBe(0);
  });

  it('should handle nested property access using className prefix (Enum pattern)', async () => {
    vi.doMock('../../src/runtime/loader', () => ({
      __esModule: true,
      classMap: {
        MockClass: { kind: 'class', methods: {} },
        'MockClass.Color': {
          kind: 'enum',
          members: { RED: '#FF0000' },
        },
      },
    }));
    const { createMock } = await import('../../src/runtime/factory');
    const mock = createMock('MockClass');
    expect((mock as any).Color.RED).toBe('#FF0000');
  });

  it('should handle isIterable flag and return an array of mocks', async () => {
    vi.doMock('../../src/runtime/loader', () => ({
      __esModule: true,
      classMap: {
        MockClass: {
          kind: 'class',
          methods: {
            getItems: {
              returnType: 'MockItem',
              isChainable: true,
              isIterable: true,
            },
          },
        },
        MockItem: {
          kind: 'class',
          methods: { getName: { returnType: 'String', isChainable: false } },
        },
      },
    }));
    const { createMock } = await import('../../src/runtime/factory');
    const mock = createMock('MockClass');
    const items = mock.getItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(1);
    expect(items[0].getName()).toBe('');
  });
});
