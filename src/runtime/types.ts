/**
 * 文字列パス（"SpreadsheetApp.getActiveSpreadsheet..."）を分解し、
 * オブジェクト階層から該当する型を抽出するユーティリティ型
 */
export type Get<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? // biome-ignore lint/suspicious/noExplicitAny: generic matching requires any
      T[Key] extends (...args: any[]) => infer R
      ? Get<R, Rest>
      : Get<T[Key], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * GAS の全サービスを統合するレジストリ
 * 必要に応じて他のサービスも追加
 */
export interface GasRegistry {
  SpreadsheetApp: GoogleAppsScript.Spreadsheet.SpreadsheetApp;
  DriveApp: GoogleAppsScript.Drive.DriveApp;
  DocumentApp: GoogleAppsScript.Document.DocumentApp;
  SlidesApp: GoogleAppsScript.Slides.SlidesApp;
  FormApp: GoogleAppsScript.Forms.FormApp;
  GmailApp: GoogleAppsScript.Gmail.GmailApp;
  CalendarApp: GoogleAppsScript.Calendar.CalendarApp;
  ContactsApp: GoogleAppsScript.Contacts.ContactsApp;
  UrlFetchApp: GoogleAppsScript.URL_Fetch.UrlFetchApp;
  PropertiesService: GoogleAppsScript.Properties.PropertiesService;
  CacheService: GoogleAppsScript.Cache.CacheService;
  LockService: GoogleAppsScript.Lock.LockService;
  Utilities: GoogleAppsScript.Utilities.Utilities;
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
