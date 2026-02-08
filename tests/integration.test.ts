import { describe, expect, it } from 'vitest';

declare const SpreadsheetApp: any;
declare const DriveApp: any;
declare const DocumentApp: any;
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

  it('should have Enums globally available', () => {
    expect(BorderStyle).toBeDefined();
    expect(BorderStyle.SOLID).toBeDefined();
    expect(typeof BorderStyle.SOLID).toBe('string');
  });

  it('should allow accessing enums through SpreadsheetApp', () => {
    expect(SpreadsheetApp.BorderStyle).toBeDefined();
    expect(SpreadsheetApp.BorderStyle.SOLID).toBe('SOLID');
  });

  it('should have other globals like DriveApp', () => {
    expect(DriveApp).toBeDefined();
    expect(DriveApp.getFiles).toBeDefined();
  });
});

describe('Namespace Isolation', () => {
  it('should distinguish between Spreadsheet Range and Document Range', () => {
    const ssRange = SpreadsheetApp.getActiveSpreadsheet().getRange('A1');

    // SpreadsheetApp.Range has getValue()
    expect(ssRange.getValue).toBeDefined();
    expect(typeof ssRange.getValue).toBe('function');

    const docRange = DocumentApp.create('TestDoc').newRange();

    // DocumentApp.Range has getRangeElements but NOT getValue
    expect(docRange.getRangeElements).toBeDefined();
    expect(typeof docRange.getRangeElements).toBe('function');
    expect(docRange.getValue).toBeUndefined();
  });
});
