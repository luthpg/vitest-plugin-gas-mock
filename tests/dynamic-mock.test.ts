import { describe, expect, it } from 'vitest';
import { mockChain } from '../src/runtime/helpers';

describe('Dynamic Mock Behavior', () => {
  it('should support static value override (backward compatibility)', () => {
    mockChain('SpreadsheetApp.getActiveSpreadsheet.getName', 'Static Name');
    expect(SpreadsheetApp.getActiveSpreadsheet().getName()).toBe('Static Name');
  });

  it('should support dynamic value via callback', () => {
    mockChain('SpreadsheetApp.getActiveSpreadsheet.getSheetByName', (name) => {
      return {
        getName: () => `Sheet: ${name}`,
      };
    });

    const sheet1 =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Test1');
    expect(sheet1?.getName()).toBe('Sheet: Test1');

    const sheet2 =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Test2');
    expect(sheet2?.getName()).toBe('Sheet: Test2');
  });

  it('should support callback with side effects', () => {
    let callCount = 0;
    mockChain('DriveApp.getFiles', () => {
      callCount++;
      return {
        hasNext: () => false,
      };
    });

    DriveApp.getFiles();
    DriveApp.getFiles();
    expect(callCount).toBe(2);
  });

  it('should support throwing errors in callback', () => {
    mockChain('SpreadsheetApp.openById', (id: string) => {
      if (id === 'invalid_id') {
        throw new Error('Spreadsheet not found');
      }
      return { getId: () => id };
    });

    expect(() => SpreadsheetApp.openById('invalid_id')).toThrow(
      'Spreadsheet not found',
    );
    expect(SpreadsheetApp.openById('valid_id').getId()).toBe('valid_id');
  });

  it('should pass multiple arguments to callback', () => {
    mockChain(
      'SpreadsheetApp.getActiveSpreadsheet.toast',
      (msg: string, title?: string) => {
        return `Toast: ${msg} (${title || 'No Title'})`;
      },
    );

    const app = SpreadsheetApp.getActiveSpreadsheet();
    expect(app.toast('Hello', 'Greeting')).toBe('Toast: Hello (Greeting)');
    expect(app.toast('Hi')).toBe('Toast: Hi (No Title)');
  });

  it('should infer types correctly (compile-time check)', () => {
    // NOTE: This test is mainly for checking if the code compiles without type errors.
    // In an ideal setup we would use `tsd` or similar to assert types, but here we
    // rely on the build process to catch type errors.

    // Correct usage
    mockChain(
      'SpreadsheetApp.getActiveSpreadsheet.getName',
      () => 'Dynamic Name',
    );

    // Incorrect usage (commented out to avoid build failure, but serves as documentation)
    // mockChain('SpreadsheetApp.getActiveSpreadsheet.getName', (arg: number) => 'Name'); // Argument type mismatch
    // mockChain('SpreadsheetApp.getActiveSpreadsheet.getName', () => 123); // Return type mismatch
  });
});
