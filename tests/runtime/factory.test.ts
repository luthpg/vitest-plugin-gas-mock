import { beforeEach, describe, expect, test } from 'vitest';
import { createMock } from '../../src/runtime/factory';
import { clearMocks, mockChain } from '../../src/runtime/helpers';

describe('factory integration', () => {
  beforeEach(() => {
    clearMocks();
  });

  test('should create a mock for SpreadsheetApp', () => {
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp');
    expect(ssApp).toBeDefined();
  });

  test('should support method chaining', () => {
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp');
    const sheet = ssApp.getActiveSpreadsheet().getSheetByName('Sheet1');

    expect(sheet).toBeDefined();
    expect(ssApp.getActiveSpreadsheet).toHaveBeenCalled();
    expect(sheet.activate).toBeDefined();
  });

  test('should support mockChain override', () => {
    mockChain('SpreadsheetApp.getActiveSpreadsheet.getName', 'Mocked SS');
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp');
    expect(ssApp.getActiveSpreadsheet().getName()).toBe('Mocked SS');
  });

  test('should return default values for primitives', () => {
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp');
    expect(ssApp.flush()).toBeUndefined(); // returns void

    const ss = ssApp.getActiveSpreadsheet();
    expect(ss.getName()).toBe(''); // returns string (capitalized String in map.json)
  });

  test('should handle iterable return types', () => {
    const ss = createMock('Spreadsheet', 'Spreadsheet');
    const sheets = ss.getSheets();

    expect(Array.isArray(sheets)).toBe(true);
    expect(sheets.length).toBe(1);
    expect(sheets[0].activate).toBeDefined();
  });
});
