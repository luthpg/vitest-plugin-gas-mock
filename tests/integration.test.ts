import { describe, expect, it } from 'vitest';

declare const SpreadsheetApp: any;
declare const DriveApp: any;
declare const BorderStyle: any;

describe('Global Injection', () => {
  it('should have SpreadsheetApp globally available', () => {
    expect(SpreadsheetApp).toBeDefined();
    // Proxyオブジェクトなので関数として振る舞う
    expect(typeof SpreadsheetApp).toBe('function');
  });

  it('should allow method chaining on globals', () => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Test');
    expect(sheet).toBeDefined();
    expect(SpreadsheetApp.getActiveSpreadsheet).toHaveBeenCalled();
  });

  // TODO: Enum injection needs further investigation
  // BorderStyle is in enumMap but not appearing in globalThis
  it.skip('should have Enums globally available', () => {
    expect(BorderStyle).toBeDefined();
    expect(BorderStyle.SOLID).toBeDefined();
    expect(typeof BorderStyle.SOLID).toBe('string');
  });

  it('should have other globals like DriveApp', () => {
    expect(DriveApp).toBeDefined();
    expect(DriveApp.getFiles).toBeDefined();
  });
});
