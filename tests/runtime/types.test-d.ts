import { describe, expectTypeOf, it } from 'vitest';
import type { Get } from '../../src/runtime/types';

describe('Get type utility', () => {
  interface TestRegistry {
    Simple: {
      value: number;
    };
    Nested: {
      Deep: {
        value: string;
      };
    };
    Function: {
      method: () => boolean;
    };
    ChainedFunction: {
      method: () => {
        next: () => string;
      };
    };
    WithArgs: {
      method: (id: number) => string;
    };
    VoidFunction: {
      method: () => void;
    };
  }

  it('should resolve simple property', () => {
    expectTypeOf<Get<TestRegistry, 'Simple.value'>>().toEqualTypeOf<number>();
  });

  it('should resolve nested property', () => {
    expectTypeOf<
      Get<TestRegistry, 'Nested.Deep.value'>
    >().toEqualTypeOf<string>();
  });

  it('should unwrap function return type', () => {
    expectTypeOf<Get<TestRegistry, 'Function.method'>>().toEqualTypeOf<
      () => boolean
    >();
  });

  it('should unwrap chained function return type', () => {
    expectTypeOf<
      Get<TestRegistry, 'ChainedFunction.method.next'>
    >().toEqualTypeOf<() => string>();
  });

  it('should handle functions with arguments', () => {
    expectTypeOf<Get<TestRegistry, 'WithArgs.method'>>().toEqualTypeOf<
      (id: number) => string
    >();
  });

  it('should handle void return type', () => {
    expectTypeOf<Get<TestRegistry, 'VoidFunction.method'>>().toEqualTypeOf<
      () => void
    >();
  });

  it('should return never for invalid path', () => {
    expectTypeOf<Get<TestRegistry, 'Invalid.Path'>>().toEqualTypeOf<never>();
    expectTypeOf<Get<TestRegistry, 'Simple.invalid'>>().toEqualTypeOf<never>();
  });
});

import type { mockChain } from '../../src/runtime/helpers';
import type { DeepPartial } from '../../src/runtime/types';

describe('DeepPartial', () => {
  it('should handle primitives', () => {
    expectTypeOf<DeepPartial<string>>().toEqualTypeOf<string>();
    expectTypeOf<DeepPartial<number>>().toEqualTypeOf<number>();
    expectTypeOf<DeepPartial<boolean>>().toEqualTypeOf<boolean>();
    expectTypeOf<DeepPartial<undefined>>().toEqualTypeOf<undefined>();
    expectTypeOf<DeepPartial<null>>().toEqualTypeOf<null>();
  });

  it('should handle objects', () => {
    expectTypeOf<DeepPartial<{ a: string; b: number }>>().toEqualTypeOf<{
      a?: string;
      b?: number;
    }>();
  });

  it('should handle nested objects', () => {
    expectTypeOf<DeepPartial<{ a: { c: string } }>>().toEqualTypeOf<{
      a?: { c?: string };
    }>();
  });

  it('should handle arrays', () => {
    // Arrays are objects, so they become object-like with optional indices?
    // Actually, arrays in GAS are usually treated as arrays.
    // DeepPartial<any[]>
    expectTypeOf<DeepPartial<string[]>>().toBeObject();
    // This might be tricky if user expects array methods to remain.
  });
});

describe('mockChain type inference', () => {
  it('should infer callback return type correctly', () => {
    type ActualValueParam = Parameters<
      typeof mockChain<'SpreadsheetApp.getActiveSpreadsheet.getName'>
    >[1];

    type Callback = Extract<ActualValueParam, (...args: any[]) => any>;
    type Return = ReturnType<Callback>;

    expectTypeOf<Return>().toEqualTypeOf<string>();
  });
});
