# Agent Development Guide

## Repository Overview

### Purpose
This repository contains a comprehensive n8n community node for **InfluxDB v2.x**, enabling users to interact with InfluxDB time-series databases directly from their n8n workflows. The node supports all major operations including data writing, querying with Flux language, data deletion, bucket management, and organization management.

### Architecture
The codebase follows a **modular operation-based design** where each major operation type (write, query, delete, bucket, organization) is implemented in a separate module. This approach provides:

- **Separation of concerns**: Each operation module is self-contained
- **Easier testing**: Smaller units can be tested independently
- **Better maintainability**: Changes to one operation don't affect others
- **Simplified debugging**: Issues can be isolated to specific modules

### Technology Stack
- **Runtime**: Node.js v20.x LTS
- **Language**: TypeScript v5.x with strict mode enabled
- **n8n SDK**: Latest n8n-workflow and n8n-core packages
- **InfluxDB Client**: @influxdata/influxdb-client and @influxdata/influxdb-client-apis
- **Testing Framework**: Jest with ts-jest for TypeScript support
- **HTTP Mocking**: nock for API response mocking in tests
- **Build Tool**: TypeScript compiler (tsc)
- **Code Quality**: ESLint with TypeScript support, Prettier for formatting

## Development Setup

### Prerequisites
- **Node.js**: v20.x or higher (use `node --version` to check)
- **npm**: v9.x or higher (bundled with Node.js)
- **Git**: For version control
- **InfluxDB v2.x**: For integration testing (optional, can use mocks)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-nodes-influxdb.git
cd n8n-nodes-influxdb

# Install dependencies
npm install
# OR using make
make install
```

### Development Workflow

```bash
# Start TypeScript compiler in watch mode
npm run dev
# OR
make dev

# Run tests in watch mode (in another terminal)
npm run test:watch
# OR
make test-watch

# Run type checking
npm run typecheck
# OR
make typecheck

# Run linter
npm run lint
# OR
make lint
```

### Building

```bash
# Compile TypeScript to JavaScript
npm run build
# OR
make build
```

The compiled output will be in the `dist/` directory.

### Testing

```bash
# Run all tests
npm test
# OR
make test

# Run only unit tests
npm run test:unit
# OR
make test-unit

# Run only integration tests
npm run test:integration
# OR
make test-integration

# Run tests with coverage report
npm run test:coverage
# OR
make test-coverage
```

### Pre-commit Verification

Before committing code, always run:

```bash
npm run verify
# OR
make verify
```

This runs:
1. ESLint (code quality)
2. TypeScript type checking
3. All tests

All checks must pass before committing.

## Project Structure

```
n8n-nodes-influxdb/
├── credentials/                      # n8n credential configurations
│   └── InfluxDbApi.credentials.ts   # InfluxDB API credential definition
├── nodes/                            # n8n node implementations
│   └── InfluxDb/                    # Main InfluxDB node
│       ├── InfluxDb.node.ts         # Node entry point and router
│       ├── InfluxDb.node.json       # Node metadata (icon, name, version)
│       ├── influxdb.svg             # Node icon
│       ├── operations/              # Operation modules
│       │   ├── write.operation.ts   # Write data operations
│       │   ├── query.operation.ts   # Query (Flux) operations
│       │   ├── delete.operation.ts  # Delete data operations
│       │   ├── bucket.operation.ts  # Bucket management
│       │   └── organization.operation.ts # Organization management
│       ├── helpers/                 # Utility modules
│       │   ├── client.ts            # InfluxDB client factory
│       │   ├── validators.ts        # Input validation utilities
│       │   └── formatters.ts        # Response formatting utilities
│       └── types/                   # TypeScript type definitions
│           └── index.ts             # Shared types and interfaces
├── tests/                           # Test suite
│   ├── unit/                        # Unit tests (isolated functions)
│   │   ├── write.test.ts
│   │   ├── query.test.ts
│   │   ├── delete.test.ts
│   │   ├── bucket.test.ts
│   │   ├── organization.test.ts
│   │   ├── validators.test.ts
│   │   └── formatters.test.ts
│   ├── integration/                 # Integration tests (full node execution)
│   │   └── node.integration.test.ts
│   └── mocks/                       # Mock data and utilities
│       ├── influxdb-responses.ts    # Mock InfluxDB API responses
│       ├── n8n-context.ts           # Mock n8n execution context
│       └── test-data.ts             # Test fixtures and sample data
├── docs/                            # Documentation
│   └── examples/                    # Usage examples
│       ├── write-data.md
│       ├── query-data.md
│       ├── delete-data.md
│       ├── manage-buckets.md
│       └── manage-organizations.md
├── package.json                     # Project metadata and dependencies
├── tsconfig.json                    # TypeScript configuration
├── jest.config.js                   # Jest testing configuration
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc.json                 # Prettier configuration
├── .gitignore                       # Git ignore patterns
├── Makefile                         # Build automation
├── AGENTS.md                        # This file - agent development guide
├── README.md                        # User documentation
└── CHANGELOG.md                     # Version history
```

### Key Directories and Files

#### `credentials/`
Contains n8n credential type definitions. The `InfluxDbApi.credentials.ts` file defines what credentials users need to provide (URL, token, organization) and includes a test method to verify the connection.

#### `nodes/InfluxDb/`
The main node implementation:
- **InfluxDb.node.ts**: Entry point that implements the `INodeType` interface. Routes execution to appropriate operation modules.
- **operations/**: Each file handles a specific resource type (write, query, delete, bucket, organization).
- **helpers/**: Shared utilities used across operations.
- **types/**: TypeScript interfaces and types for type safety.

#### `tests/`
Comprehensive test suite:
- **unit/**: Tests for individual functions in isolation with mocked dependencies.
- **integration/**: Tests for complete node execution flows.
- **mocks/**: Reusable mock data and helper functions.

## Coding Standards

### TypeScript Strict Mode
All code MUST be written with TypeScript strict mode enabled. This means:
- No implicit `any` types
- All function parameters and return types must be explicitly typed
- Null and undefined must be handled explicitly
- Unused variables and parameters are errors

### Documentation Requirements

**CRITICAL**: Documentation is a first-class citizen in this codebase.

#### Every Function Must Have JSDoc
```typescript
/**
 * Creates and configures an InfluxDB client instance.
 *
 * This function initializes a new InfluxDB client with the provided credentials,
 * sets up connection pooling, configures timeouts, and applies error transformation.
 *
 * @param credentials - The InfluxDB API credentials containing URL, token, and organization
 * @param timeout - Optional request timeout in milliseconds (default: 30000)
 * @returns A configured InfluxDB client instance ready for operations
 * @throws {NodeOperationError} If credentials are invalid or connection cannot be established
 *
 * @example
 * const client = createInfluxDbClient({
 *   url: 'http://localhost:8086',
 *   token: 'my-token',
 *   organization: 'my-org'
 * });
 */
export function createInfluxDbClient(
  credentials: IInfluxDbCredentials,
  timeout?: number
): InfluxDB {
  // Implementation
}
```

#### Every Class Must Have JSDoc
```typescript
/**
 * Validator for InfluxDB-specific input formats.
 *
 * This class provides validation methods for Flux queries, measurement names,
 * tag keys, field types, and time range formats. All methods are static and
 * can be used without instantiation.
 *
 * @example
 * if (!InfluxDbValidator.isValidMeasurementName('cpu-usage')) {
 *   throw new Error('Invalid measurement name');
 * }
 */
export class InfluxDbValidator {
  // Implementation
}
```

#### Every Variable Must Have Comments
```typescript
// The default timeout for InfluxDB API requests in milliseconds
const DEFAULT_TIMEOUT = 30000;

// Regular expression to validate measurement names (alphanumeric, hyphens, underscores)
const MEASUREMENT_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Map of field type names to their InfluxDB type identifiers
const FIELD_TYPE_MAP: Record<string, string> = {
  float: 'float',
  integer: 'int',
  string: 'string',
  boolean: 'bool',
};
```

#### Complex Functions Need Examples
For any function with complex logic, multiple parameters, or non-obvious behavior, include usage examples in the JSDoc:

```typescript
/**
 * Formats Flux query results into n8n JSON items.
 *
 * @param results - Raw Flux query results from the InfluxDB client
 * @param options - Formatting options
 * @param options.timestampFormat - Format for timestamps ('iso', 'unix', or 'relative')
 * @param options.flattenTables - Whether to flatten multiple tables into a single array
 * @returns Array of n8n JSON items
 *
 * @example
 * const items = formatFluxResults(results, {
 *   timestampFormat: 'iso',
 *   flattenTables: true
 * });
 * // Returns: [{ _time: '2024-01-01T00:00:00Z', _value: 42, ... }]
 *
 * @example
 * const items = formatFluxResults(results, {
 *   timestampFormat: 'unix',
 *   flattenTables: false
 * });
 * // Returns: [{ table: 0, rows: [...] }, { table: 1, rows: [...] }]
 */
```

### Documentation Lifecycle
- **Documentation is only deleted when the code it documents is deleted**
- When refactoring, update documentation to match
- When adding features, add documentation before or during implementation
- When fixing bugs, ensure documentation is still accurate

### Naming Conventions

#### Files and Directories
- **Lowercase with hyphens**: `write.operation.ts`, `influxdb-responses.ts`
- **Descriptive names**: `validators.test.ts` not `val.test.ts`

#### Variables and Functions
- **camelCase**: `createClient`, `isValidMeasurement`, `formatResults`
- **Descriptive**: `measurementName` not `mn`, `queryResults` not `qr`
- **Boolean prefixes**: `isValid`, `hasError`, `canExecute`

#### Types and Interfaces
- **PascalCase**: `IInfluxDbCredentials`, `WritePointOptions`, `QueryResult`
- **Prefix interfaces with `I`**: `INodeType`, `IExecuteFunctions`
- **Descriptive suffixes**: `Options`, `Result`, `Error`, `Response`

#### Constants
- **UPPER_SNAKE_CASE**: `DEFAULT_TIMEOUT`, `MAX_BATCH_SIZE`, `API_VERSION`

### Error Handling Patterns

#### Use n8n Error Types
```typescript
import { NodeOperationError, NodeApiError } from 'n8n-workflow';

// For user input errors or operation errors
throw new NodeOperationError(
  this.getNode(),
  'Invalid measurement name. Must be alphanumeric with hyphens or underscores.',
  { itemIndex }
);

// For API/network errors
throw new NodeApiError(this.getNode(), error as Error, {
  message: 'Failed to write data to InfluxDB',
  description: error.message,
  httpCode: error.statusCode,
});
```

#### Always Validate Input
```typescript
// Validate before processing
if (!measurementName || !MEASUREMENT_NAME_REGEX.test(measurementName)) {
  throw new NodeOperationError(
    this.getNode(),
    `Invalid measurement name: "${measurementName}"`
  );
}

// Validate array inputs
if (!Array.isArray(points) || points.length === 0) {
  throw new NodeOperationError(
    this.getNode(),
    'Points must be a non-empty array'
  );
}
```

#### Wrap External API Calls
```typescript
try {
  await writeApi.writePoint(point);
  await writeApi.close();
} catch (error) {
  throw new NodeApiError(this.getNode(), error as Error, {
    message: 'InfluxDB write operation failed',
    description: (error as Error).message,
  });
}
```

## Testing Requirements

**CRITICAL**: No task is complete until comprehensive tests are written and passing.

### Test Coverage Targets
- **Overall**: 90% or higher
- **Unit tests**: 95% or higher (functions should be thoroughly tested)
- **Integration tests**: 85% or higher (focus on critical paths)

### Test-Driven Development (TDD)
The preferred workflow is:
1. **Write tests first** that define expected behavior
2. **Run tests** (they should fail)
3. **Implement** the functionality
4. **Run tests** (they should pass)
5. **Refactor** while keeping tests green

### Unit Test Structure
```typescript
import { validateMeasurementName } from '../../../nodes/InfluxDb/helpers/validators';

describe('validators', () => {
  describe('validateMeasurementName', () => {
    it('should accept valid alphanumeric names', () => {
      expect(validateMeasurementName('cpu')).toBe(true);
      expect(validateMeasurementName('cpu_usage')).toBe(true);
      expect(validateMeasurementName('cpu-usage')).toBe(true);
      expect(validateMeasurementName('cpu123')).toBe(true);
    });

    it('should reject names with special characters', () => {
      expect(validateMeasurementName('cpu usage')).toBe(false);
      expect(validateMeasurementName('cpu@usage')).toBe(false);
      expect(validateMeasurementName('cpu.usage')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateMeasurementName('')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateMeasurementName(null as unknown as string)).toBe(false);
      expect(validateMeasurementName(undefined as unknown as string)).toBe(false);
    });
  });
});
```

### Integration Test Structure
```typescript
import nock from 'nock';
import { executeNode } from '../helpers/node-executor';
import { mockInfluxDbResponses } from '../mocks/influxdb-responses';

describe('InfluxDb Node - Write Operation', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it('should write a single point successfully', async () => {
    // Mock the InfluxDB API
    const scope = nock('http://localhost:8086')
      .post('/api/v2/write')
      .query({ bucket: 'test-bucket', org: 'test-org', precision: 'ns' })
      .reply(204);

    // Execute the node
    const result = await executeNode({
      resource: 'write',
      operation: 'writePoint',
      measurement: 'temperature',
      tags: { location: 'room1' },
      fields: { value: 23.5 },
    });

    // Assertions
    expect(scope.isDone()).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].json).toMatchObject({
      success: true,
      measurement: 'temperature',
    });
  });

  it('should handle write errors gracefully', async () => {
    // Mock an error response
    const scope = nock('http://localhost:8086')
      .post('/api/v2/write')
      .reply(400, { message: 'Invalid line protocol' });

    // Expect the error to be thrown
    await expect(
      executeNode({
        resource: 'write',
        operation: 'writePoint',
        measurement: 'invalid',
      })
    ).rejects.toThrow('InfluxDB write operation failed');

    expect(scope.isDone()).toBe(true);
  });
});
```

### Mocking Best Practices

#### Use nock for HTTP Mocking
```typescript
import nock from 'nock';

// Mock successful response
nock('http://localhost:8086')
  .get('/api/v2/query')
  .query({ org: 'test-org' })
  .reply(200, mockFluxQueryResponse);

// Mock error response
nock('http://localhost:8086')
  .get('/api/v2/query')
  .reply(500, { message: 'Internal server error' });

// Mock timeout
nock('http://localhost:8086')
  .get('/api/v2/query')
  .delayConnection(31000)
  .reply(200);
```

#### Create Reusable Mocks
```typescript
// tests/mocks/influxdb-responses.ts
export const mockFluxQueryResponse = {
  results: [
    {
      series: [
        {
          name: 'temperature',
          columns: ['time', 'value'],
          values: [
            ['2024-01-01T00:00:00Z', 23.5],
            ['2024-01-01T01:00:00Z', 24.2],
          ],
        },
      ],
    },
  ],
};
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- write.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Completion Checklist
Before marking a task as complete:
- [ ] All new code has corresponding tests
- [ ] All tests pass (`npm test` exits with 0)
- [ ] Coverage meets targets (check with `npm run test:coverage`)
- [ ] Both success and error paths are tested
- [ ] Edge cases are covered (empty inputs, null values, large datasets)
- [ ] Integration tests cover the full execution flow

## Type Checking & Linting

### Type Checking
```bash
# Run TypeScript compiler in check mode
npm run typecheck
# OR
make typecheck
```

**All type errors must be fixed before committing.** Do not use `@ts-ignore` or `any` types to bypass errors.

### Linting
```bash
# Check for lint errors
npm run lint
# OR
make lint

# Auto-fix fixable issues
npm run lint:fix
# OR
make lint-fix
```

**All lint warnings and errors must be fixed before committing.**

### Common Type Errors and Solutions

#### Error: "Implicit any type"
```typescript
// ❌ Bad
function processData(data) {
  return data.value;
}

// ✅ Good
function processData(data: { value: number }): number {
  return data.value;
}
```

#### Error: "Object is possibly undefined"
```typescript
// ❌ Bad
const value = item.json.value;

// ✅ Good
const value = item.json?.value ?? 0;
// Or with explicit check
if (item.json && 'value' in item.json) {
  const value = item.json.value;
}
```

#### Error: "Promise returned is not awaited"
```typescript
// ❌ Bad
async function execute() {
  writeApi.writePoint(point);
}

// ✅ Good
async function execute(): Promise<void> {
  await writeApi.writePoint(point);
}
```

## Operations Guide

### Adding a New Operation

1. **Define the operation in the node description** (`InfluxDb.node.ts`):
```typescript
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['myResource'],
    },
  },
  options: [
    {
      name: 'myOperation',
      value: 'myOperation',
      description: 'Description of what this operation does',
      action: 'Perform my operation',
    },
  ],
  default: 'myOperation',
}
```

2. **Create the operation module** (`operations/myresource.operation.ts`):
```typescript
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { InfluxDB } from '@influxdata/influxdb-client';

/**
 * Executes my custom operation on InfluxDB.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param items - Input items from previous node
 * @param itemIndex - Index of current item being processed
 * @returns Array of output items
 */
export async function executeMyOperation(
  this: IExecuteFunctions,
  client: InfluxDB,
  items: INodeExecutionData[],
  itemIndex: number
): Promise<INodeExecutionData[]> {
  // Get operation parameters
  const paramValue = this.getNodeParameter('paramName', itemIndex) as string;

  // Validate input
  if (!paramValue) {
    throw new NodeOperationError(this.getNode(), 'Parameter is required');
  }

  // Execute operation
  try {
    const result = await performOperation(client, paramValue);
    return [
      {
        json: result,
        pairedItem: { item: itemIndex },
      },
    ];
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as Error);
  }
}
```

3. **Add parameter definitions** in the node description.

4. **Import and route** in the main execute method:
```typescript
import { executeMyOperation } from './operations/myresource.operation';

// In execute() method
if (resource === 'myResource') {
  if (operation === 'myOperation') {
    returnData.push(...await executeMyOperation.call(this, client, items, i));
  }
}
```

5. **Write tests** (`tests/unit/myresource.test.ts`):
```typescript
describe('MyResource Operations', () => {
  describe('executeMyOperation', () => {
    it('should execute successfully with valid input', async () => {
      // Test implementation
    });

    it('should throw error with invalid input', async () => {
      // Test implementation
    });
  });
});
```

### Modifying Existing Operations

1. **Read the operation module** to understand current implementation
2. **Check existing tests** to understand expected behavior
3. **Update tests first** to reflect new behavior
4. **Modify the operation code**
5. **Update JSDoc** comments if behavior changed
6. **Run tests** to ensure nothing broke
7. **Update integration tests** if needed

### Operation Module Best Practices

- Keep operations focused and single-purpose
- Extract complex logic into helper functions
- Always validate inputs before processing
- Use type guards for runtime type safety
- Return consistent data structures
- Include `pairedItem` for proper item tracking

## Troubleshooting

### Common Errors and Solutions

#### "Cannot find module 'n8n-workflow'"
**Solution**: Install peer dependencies
```bash
npm install
```

#### Tests fail with "ReferenceError: TextEncoder is not defined"
**Solution**: Update Jest configuration to use Node environment (already configured in `jest.config.js`)

#### "InfluxDB connection refused"
**Solution**:
- Ensure InfluxDB is running: `docker ps`
- Check URL in credentials matches your setup
- Verify token has correct permissions

#### TypeScript errors about missing types
**Solution**: Install type definitions
```bash
npm install --save-dev @types/node @types/jest
```

#### ESLint fails with parsing errors
**Solution**: Ensure `tsconfig.json` is in project root and referenced in `.eslintrc.js`

### Debugging Techniques

#### Debug Tests
```typescript
// Add console.log in tests
it('should do something', () => {
  console.log('Debug value:', someValue);
  expect(someValue).toBe(expected);
});

// Run single test file with verbose output
npm test -- --verbose write.test.ts
```

#### Debug Node Execution
```typescript
// In operation modules, use console.log (but remove before committing)
export async function executeWritePoint(/* ... */) {
  console.log('Parameters:', { measurement, tags, fields });
  // ...
}
```

#### Debug n8n Integration
1. Link the package locally:
```bash
npm run build
npm link
```

2. In your n8n installation:
```bash
cd ~/.n8n/custom
npm link n8n-nodes-influxdb
```

3. Restart n8n with debug logging:
```bash
N8N_LOG_LEVEL=debug n8n start
```

### InfluxDB Connection Issues

#### Invalid Token
- Verify token in InfluxDB UI: Settings → Tokens
- Ensure token has read/write permissions for target buckets
- Check token hasn't expired

#### Organization Not Found
- Verify organization name is exact match (case-sensitive)
- Can also use organization ID instead of name

#### Bucket Not Found
- List available buckets: `influx bucket list`
- Check bucket name spelling and case
- Ensure authenticated user has access to bucket

### n8n Node Loading Issues

#### Node doesn't appear in n8n UI
- Check `package.json` has correct `n8n` section
- Verify build output in `dist/` directory
- Restart n8n after installing/updating node
- Check n8n logs for loading errors

#### Node appears but operations fail
- Check n8n logs: `~/.n8n/logs/`
- Verify credentials are configured correctly
- Test credentials using the "Test" button
- Check for TypeScript errors: `npm run typecheck`

## Release Process

### Version Bumping
Follow Semantic Versioning (semver):
- **Patch** (0.1.0 → 0.1.1): Bug fixes, no breaking changes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

```bash
# Update version in package.json
npm version patch  # or minor, or major

# This automatically creates a git tag
```

### Changelog Updates
Update `CHANGELOG.md` before releasing:

```markdown
## [0.2.0] - 2024-01-15

### Added
- New operation: Delete by predicate
- Support for custom timeout configuration

### Changed
- Improved error messages for invalid Flux queries
- Updated InfluxDB client to v1.33.2

### Fixed
- Fixed timestamp formatting in query results
- Corrected bucket creation validation

### Security
- Updated dependencies to address vulnerabilities
```

### Publishing to npm

```bash
# Ensure everything is committed
git status

# Run full verification
make verify

# Build production bundle
npm run build

# Publish to npm (requires npm account and permissions)
npm publish

# OR use make target
make publish
```

### Pre-publish Checklist
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No lint warnings (`npm run lint`)
- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated
- [ ] `README.md` updated if needed
- [ ] All changes committed
- [ ] Git tag created (`npm version`)

## Additional Resources

### n8n Documentation
- [Creating Nodes](https://docs.n8n.io/integrations/creating-nodes/build/)
- [Node Development](https://docs.n8n.io/integrations/creating-nodes/build/node-development/)
- [Publishing Nodes](https://docs.n8n.io/integrations/creating-nodes/publish/)

### InfluxDB Documentation
- [JavaScript Client](https://github.com/influxdata/influxdb-client-js)
- [InfluxDB v2 API](https://docs.influxdata.com/influxdb/v2/api/)
- [Flux Query Language](https://docs.influxdata.com/flux/v0/)
- [Write API](https://docs.influxdata.com/influxdb/v2/write-data/)
- [Query API](https://docs.influxdata.com/influxdb/v2/query-data/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [nock Documentation](https://github.com/nock/nock)

## Getting Help

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review existing tests for examples
3. Check n8n community forum: https://community.n8n.io/
4. Review InfluxDB client documentation
5. Open an issue on GitHub with detailed information

## Contributing

When contributing:
1. Follow all coding standards in this guide
2. Write comprehensive tests
3. Update documentation
4. Run `make verify` before submitting
5. Create clear commit messages
6. Reference issue numbers in commits

---

**Remember**: Good code is well-documented, well-tested, and easy to understand. Take time to write clear documentation and comprehensive tests. Future you (and other developers) will thank you!
