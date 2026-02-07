import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('should handle Integer and Byte return types', async () => {
    vi.doMock('../../src/runtime/loader', () => ({
      __esModule: true,
      classMap: {
        MockClass: {
          kind: 'class',
          methods: {
            getInt: { returnType: 'Integer', isChainable: false },
            getByte: { returnType: 'Byte', isChainable: false },
          },
        },
      },
    }));
    const { createMock } = await import('../../src/runtime/factory');
    const mock = (await createMock('MockClass')) as any;
    expect(mock.getInt()).toBe(0);
    expect(mock.getByte()).toBe(0);
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
    const items = (mock as any).getItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(1);
    expect(items[0].getName()).toBe('');
  });

  it('should return Date object for Date return type', async () => {
    vi.doMock('../../src/runtime/loader', () => ({
      __esModule: true,
      classMap: {
        TestDate: {
          kind: 'class',
          methods: {
            getNow: { returnType: 'Date', isChainable: false },
          },
        },
      },
    }));

    const { createMock } = await import('../../src/runtime/factory');
    const testObj = createMock('TestDate') as any;
    const result = testObj.getNow();
    expect(result).toBeInstanceOf(Date);
  });

  it('should handle Object return type as empty object', async () => {
    vi.doMock('../../src/runtime/loader', () => ({
      __esModule: true,
      classMap: {
        TestObj: {
          kind: 'class',
          methods: {
            getAny: { returnType: 'Object', isChainable: false },
            getLiteral: {
              returnType: '{ [key: string]: string }',
              isChainable: false,
            },
          },
        },
      },
    }));

    const { createMock } = await import('../../src/runtime/factory');
    const testObj = createMock('TestObj') as any;
    expect(typeof testObj.getAny()).toBe('object');
    expect(testObj.getAny()).not.toBeNull();
    expect(typeof testObj.getLiteral()).toBe('object');
    expect(testObj.getLiteral()).not.toBeNull();
  });

  it('should handle 2D arrays from getValues()', async () => {
    vi.doMock('../../src/runtime/loader', () => ({
      __esModule: true,
      classMap: {
        Range: {
          kind: 'class',
          methods: {
            getValues: {
              returnType: 'Object',
              isChainable: false,
              dimensions: 2,
            },
          },
        },
      },
    }));

    const { createMock } = await import('../../src/runtime/factory');
    const range = createMock('Range') as any;
    const values = range.getValues();

    expect(Array.isArray(values)).toBe(true);
    expect(values.length).toBe(1);
    expect(Array.isArray(values[0])).toBe(true);
    expect(values[0].length).toBe(1);
    expect(typeof values[0][0]).toBe('object');
  });
});
