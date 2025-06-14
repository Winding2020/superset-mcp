# Superset MCP Module Structure

This project has been modularized with the following code structure:

## Directory Structure

```
src/
├── index.ts                    # Main entry file
├── types/
│   └── index.ts               # Type definitions
├── utils/
│   └── error.ts               # Error handling utilities
├── client/
│   ├── index.ts               # Client exports
│   └── superset-client.ts     # Superset API client
├── handlers/
│   ├── tool-handlers.ts       # Tool handlers
│   └── resource-handlers.ts   # Resource handlers
└── server/
    ├── tools.ts               # Tool definitions
    └── resources.ts           # Resource definitions
```

## Module Descriptions

### `types/` - Type Definitions
- `SupersetConfig`: Superset client configuration interface
- `Dataset`: Dataset data structure
- `DatasetMetric`: Dataset Metric data structure
- `DatasetColumn`: Dataset column information
- `DatasetListResponse`: API response types
- `CsrfTokenResponse`: CSRF token response

### `utils/` - Utility Functions
- `getErrorMessage()`: Unified error handling function

### `client/` - Superset Client
- `SupersetClient`: Main API client class containing all methods for interacting with Superset API
- `initializeSupersetClient()`: Client initialization function

### `handlers/` - MCP Handlers
- `handleToolCall()`: Handles all tool call requests
- `handleResourceRead()`: Handles all resource read requests

### `server/` - Server Configuration
- `toolDefinitions`: Definitions and schemas for all tools
- `resourceDefinitions`: Definitions for all resources

### `index.ts` - Main Entry
- Create MCP server
- Register request handlers
- Start server

## Advantages

1. **Modular**: Code is separated by functionality, easy to maintain and extend
2. **Type Safety**: Unified type definitions reduce type errors
3. **Testability**: Each module can be tested independently
4. **Extensibility**: New features can be easily added to corresponding modules
5. **Code Reuse**: Client and utility functions can be reused in different places

## Adding New Features

1. **New API methods**: Add in `client/superset-client.ts`
2. **New tools**: Define in `server/tools.ts`, implement in `handlers/tool-handlers.ts`
3. **New resources**: Define in `server/resources.ts`, implement in `handlers/resource-handlers.ts`
4. **New types**: Add in `types/index.ts` 