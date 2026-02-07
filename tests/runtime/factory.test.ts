import { beforeEach, describe, expect, test } from 'vitest';
import { createMock } from '../../src/runtime/factory';
import { clearMocks, mockChain } from '../../src/runtime/helpers';

describe('factory', () => {
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
    expect(sheet.activate).toBeDefined(); // Sheet has activate method
  });

  test('should support mockChain override for default values', () => {
    mockChain(
      'SpreadsheetApp.getActiveSpreadsheet.getSheetByName.getName',
      'Overridden Sheet Name',
    );

    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp');
    const name = ssApp
      .getActiveSpreadsheet()
      .getSheetByName('Sheet1')
      .getName();

    expect(name).toBe('Overridden Sheet Name');
  });

  test('should return default values for primitives', () => {
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp');
    // flush() returns void -> undefined
    expect(ssApp.flush()).toBeUndefined();
  });
});
