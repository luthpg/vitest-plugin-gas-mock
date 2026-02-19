# @ciderjs/vitest-plugin-gas-mock

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/vitest-plugin-gas-mock.svg)](https://www.npmjs.com/package/@ciderjs/vitest-plugin-gas-mock)
[![NPM Downloads](https://img.shields.io/npm/dw/@ciderjs/vitest-plugin-gas-mock)](https://www.npmjs.com/package/@ciderjs/vitest-plugin-gas-mock)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/vitest-plugin-gas-mock.svg)](https://github.com/luthpg/vitest-plugin-gas-mock/issues)

Vitest plugin to mock Google Apps Script (GAS) environment.

## Features

- **Automatic Mocking**: Dynamically generates mocks based on official `@types/google-apps-script`.
- **Enum Support**: Includes support for GAS enums (e.g., `SpreadsheetApp.BorderStyle.SOLID`).
- **Method Chaining**: Supports GAS fluent APIs (e.g., `SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1')`).
- **Global Injection**: Automatically injects mocks into the global scope in tests.
- **`mockChain` Helper**: Easily override return values for complex method paths.

## Installation

```bash
pnpm add -D @ciderjs/vitest-plugin-gas-mock
```

## Setup

Add the plugin to your `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { mockGas } from '@ciderjs/vitest-plugin-gas-mock';

export default defineConfig({
  plugins: [mockGas()],
  test: {
    globals: true, // Required for global injection
  },
});
```

## Usage

### Basic Usage

Once configured, GAS services like `SpreadsheetApp`, `DriveApp`, etc., are available globally in your tests.

```typescript
import { it, expect } from 'vitest';

it('should mock SpreadsheetApp', () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  expect(ss).toBeDefined();
  
  const sheet = ss.getSheetByName('MySheet');
  expect(sheet).toBeDefined();
});
```

### Overriding Return Values with `mockChain`

Use `mockChain` to set return values for specific method call paths.

```typescript
import { it, expect } from 'vitest';
import { mockChain } from '@ciderjs/vitest-plugin-gas-mock';

it('should return specific value for a chain', () => {
  const mockValue = "Hello from mock";
  
  // Set the override
  mockChain(
    'SpreadsheetApp.getActiveSpreadsheet.getName', 
    mockValue
  );

  const name = SpreadsheetApp.getActiveSpreadsheet().getName();
  expect(name).toBe(mockValue);
});
```

### Dynamic Return Values

You can pass a callback function to `mockChain` to determine the return value dynamically based on arguments.

```typescript
mockChain('SpreadsheetApp.getActiveSpreadsheet.getSheetByName', (name) => {
  if (name === 'Missing') {
    return null;
  }
  // You can return a partial object (DeepPartial),
  // so you don't need to implement all methods like `activate`, `copy`, etc.
  return {
    getName: () => name,
  };
});
```

### Type Safety

The `mockChain` helper provides strict type inference:

- **Path Validation**: The path string (e.g., `'SpreadsheetApp.getActiveSpreadsheet'`) is validated against GAS types.
- **Callback Arguments**: Arguments in the callback function are automatically typed.
- **Return Type**: The return value is checked against the expected GAS type (supports `DeepPartial` for easier mocking).

## How it works

The plugin performs the following steps:

1. **Analyze**: Parses GAS type definitions to build a map of classes, methods, and return types.
2. **Generate**: Creates a runtime map that identifies which methods are "chainable" (i.e., return another GAS class).
3. **Inject**: Uses a Proxy-based factory to create spies (`vi.fn()`) that automatically return new proxies for chainable methods.

## Scripts

- `pnpm generate`: Refreshes the internal GAS API map (runs automatically before build/test).
- `pnpm build`: Builds the plugin.
- `pnpm test`: Runs integration and unit tests.

## License

MIT
