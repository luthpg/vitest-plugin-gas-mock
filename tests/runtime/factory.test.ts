import { beforeEach, describe, expect, test } from 'vitest';
import { createMock } from '../../src/runtime/factory';
import { clearMocks, mockChain } from '../../src/runtime/helpers';

describe('factory integration', () => {
  beforeEach(() => {
    clearMocks();
  });

  test('should create a mock for SpreadsheetApp', () => {
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp') as any;
    expect(ssApp).toBeDefined();
  });

  test('should support method chaining', () => {
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp') as any;
    const sheet = ssApp.getActiveSpreadsheet().getSheetByName('Sheet1');

    expect(sheet).toBeDefined();
    expect(ssApp.getActiveSpreadsheet).toHaveBeenCalled();
    expect(sheet.activate).toBeDefined();
  });

  test('should support mockChain override', () => {
    mockChain('SpreadsheetApp.getActiveSpreadsheet.getName', 'Mocked SS');
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp') as any;
    expect(ssApp.getActiveSpreadsheet().getName()).toBe('Mocked SS');
  });

  test('should return default values for primitives', () => {
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp');
    expect(ssApp.flush()).toBeUndefined(); // returns void

    const ss = (ssApp as any).getActiveSpreadsheet();
    expect(ss.getName()).toBe(''); // returns string (capitalized String in map.json)

    const sheet = (ss as any).getActiveSheet();
    expect(sheet.getLastRow()).toBe(0); // returns Integer
  });

  test('should return Date object for Date return type', () => {
    // TestDate is not in real map, so we use a real one if available or trust createMock logic
    // In real map, many things return Date. Let's find one.
    // e.g., Range.getLastUpdated() if it exists? No.
    // Let's just use the factory directly with a mocked type name if needed,
    // but factory.test.ts uses the real map.
    // Since I've verified it in bug_repro, I'll add a generic test if possible.

    // We can't easily mock loader here without resetModules, so let's check one that returns Date in real map.
    // e.g. "CalendarEvent.getStartTime"
    const event = createMock('CalendarEvent', 'CalendarEvent');
    expect((event as any).getStartTime()).toBeInstanceOf(Date);
  });

  test('should handle Object and any return types', () => {
    const prop = createMock('PropertiesService', 'PropertiesService');
    const scriptProps = (prop as any).getScriptProperties();
    const props = scriptProps.getProperties(); // returns Object
    expect(typeof props).toBe('object');
    expect(props).not.toBeNull();
  });

  test('should handle Enum access', () => {
    const ssApp = createMock('SpreadsheetApp', 'SpreadsheetApp') as any;
    // Direction is a nested Enum in GAS.
    // In our map.json it's SpreadsheetApp.Direction
    expect(ssApp.Direction.UP).toBeDefined();
  });

  test('should handle 2D arrays from getValues()', () => {
    const range = createMock('Range', 'Range') as any;
    const values = range.getValues();

    expect(Array.isArray(values)).toBe(true);
    expect(values.length).toBe(1);
    expect(Array.isArray(values[0])).toBe(true);
    expect(values[0].length).toBe(1);
  });
});
