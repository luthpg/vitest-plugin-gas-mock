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
          k: 'c',
          m: { getVal: { rt: 'Number' } },
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
          k: 'c',
          m: {
            getInt: { rt: 'Integer' },
            getByte: { rt: 'Byte' },
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
        MockClass: { k: 'c', m: {} },
        'MockClass.Color': {
          k: 'e',
          v: { RED: '#FF0000' },
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
          k: 'c',
          m: {
            getItems: {
              rt: 'MockItem',
              ic: 1,
              ii: 1,
            },
          },
        },
        MockItem: {
          k: 'c',
          m: { getName: { rt: 'String' } },
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
          k: 'c',
          m: {
            getNow: { rt: 'Date' },
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
          k: 'c',
          m: {
            getAny: { rt: 'Object' },
            getLiteral: {
              rt: '{ [key: string]: string }',
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
          k: 'c',
          m: {
            getValues: {
              rt: 'Object',
              d: 2,
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
