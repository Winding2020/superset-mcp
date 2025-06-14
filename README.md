# Superset MCP Server

A Model Context Protocol (MCP) server for managing Apache Superset datasets, metrics, and SQL queries.

## 🚀 Features

- **Dataset Management**: Full CRUD operations for Superset datasets
- **Metrics Management**: Create, update, and manage dataset metrics
- **SQL Query Execution**: Execute SQL queries directly through Superset
- **Database Integration**: List and manage database connections
- **Resource Access**: Browse datasets, databases, and metrics through MCP resources

## 📋 Prerequisites

- Node.js 18+ 
- Access to an Apache Superset instance
- Valid Superset credentials (username/password or access token)

## 🛠️ Installation

### Method 1: Using with Cursor (Recommended)

#### 1. Add to Cursor MCP Configuration
Add the following configuration to your Cursor MCP settings file:

```json
{
  "mcpServers": {
    "superset-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "superset-mcp"
      ],
      "env": {
        "SUPERSET_BASE_URL": "",
        "SUPERSET_USERNAME": "",
        "SUPERSET_PASSWORD": ""
      }
    }
  }
}
```

#### 2. Environment Variables
Configure your Superset connection by updating the `env` section in the MCP configuration:

```json
"env": {
  "SUPERSET_BASE_URL": "your-superset-url",
  "SUPERSET_USERNAME": "your_username",
  "SUPERSET_PASSWORD": "your_password",
}
```

**Alternative: Using Access Token**
```json
"env": {
  "SUPERSET_BASE_URL": "your-superset-url",
  "SUPERSET_ACCESS_TOKEN": "your_access_token"
}
```

### Method 2: Local Development Installation

#### 1. Clone and Install
```bash
git clone <repository-url>
cd superset-mcp
npm install
```

#### 2. Environment Configuration
Create a `.env` file or set environment variables:

```bash
# Required
export SUPERSET_BASE_URL="http://localhost:8088"

# Authentication (choose one method)
# Method 1: Username/Password
export SUPERSET_USERNAME="your_username"
export SUPERSET_PASSWORD="your_password"

# Method 2: Access Token
export SUPERSET_ACCESS_TOKEN="your_access_token"

# Optional
export SUPERSET_AUTH_PROVIDER="db"  # Options: db, ldap, oauth
```

#### 3. Build and Run
```bash
npm run build
npm start
```

## 🔧 Available Tools

### Dataset Operations
| Tool | Description |
|------|-------------|
| `list_datasets` | Get paginated list of all datasets |
| `get_dataset` | Get detailed information for a specific dataset |
| `create_dataset` | Create a new dataset |
| `update_dataset` | Update existing dataset properties |
| `delete_dataset` | Delete a dataset |
| `refresh_dataset_schema` | Refresh dataset schema from source |

### Metrics Operations
| Tool | Description |
|------|-------------|
| `get_dataset_metrics` | Get all metrics for a dataset |
| `create_dataset_metric` | Create a new metric |
| `update_dataset_metric` | Update existing metric |
| `delete_dataset_metric` | Delete a metric |
| `get_dataset_columns` | Get column information (useful for metric creation) |

### SQL Operations
| Tool | Description |
|------|-------------|
| `execute_sql` | Execute SQL queries with result limiting |

### Database Operations
| Tool | Description |
|------|-------------|
| `list_databases` | Get all configured database connections |

## 📚 Resources

Access read-only overviews through MCP resources:

- `superset://datasets` - Overview of all datasets
- `superset://databases` - List of database connections  
- `superset://dataset-metrics` - Overview of all metrics across datasets

## 💡 Usage Examples

### Dataset Management

#### Create a Dataset
```json
{
  "tool": "create_dataset",
  "arguments": {
    "database_id": 1,
    "table_name": "sales_data",
    "schema": "public",
    "description": "Sales transaction data"
  }
}
```

#### List Datasets
```json
{
  "tool": "list_datasets",
  "arguments": {
    "page": 0,
    "pageSize": 20
  }
}
```

### Metrics Management

#### Get Column Information (Before Creating Metrics)
```json
{
  "tool": "get_dataset_columns",
  "arguments": {
    "dataset_id": 1
  }
}
```

#### Create a Metric
```json
{
  "tool": "create_dataset_metric",
  "arguments": {
    "dataset_id": 1,
    "metric_name": "total_revenue",
    "expression": "SUM(amount)",
    "description": "Total revenue from sales",
    "verbose_name": "Total Revenue",
    "d3format": "$,.2f"
  }
}
```

### SQL Query Execution

#### Basic Query
```json
{
  "tool": "execute_sql",
  "arguments": {
    "database_id": 1,
    "sql": "SELECT COUNT(*) FROM users WHERE active = true"
  }
}
```

#### Advanced Query with Parameters
```json
{
  "tool": "execute_sql",
  "arguments": {
    "database_id": 1,
    "sql": "SELECT * FROM sales WHERE date >= '2024-01-01'",
    "schema": "analytics",
    "limit": 500,
    "display_rows": 10
  }
}
```

## 📖 API Reference

### Metric Field Reference
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `metric_name` | string | ✅ | Unique metric identifier |
| `expression` | string | ✅ | SQL expression for the metric |
| `metric_type` | string | ❌ | Type of metric (e.g., 'count', 'sum') |
| `description` | string | ❌ | Human-readable description |
| `verbose_name` | string | ❌ | Display name in UI |
| `d3format` | string | ❌ | D3.js format string for display |
| `warning_text` | string | ❌ | Warning message for users |
| `extra` | string | ❌ | Additional configuration (JSON) |
| `is_restricted` | boolean | ❌ | Access restriction flag |

### SQL Execution Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `database_id` | number | ✅ | - | Target database ID |
| `sql` | string | ✅ | - | SQL query to execute |
| `schema` | string | ❌ | - | Database schema |
| `limit` | number | ❌ | 1000 | Maximum rows to return |
| `expand_data` | boolean | ❌ | true | Whether to expand result data |
| `display_rows` | number | ❌ | 10 | Rows to show in preview |

## 🔍 Error Handling

The server provides comprehensive error handling with detailed messages:

- **Authentication errors**: Invalid credentials or expired tokens
- **Permission errors**: Insufficient access rights
- **Validation errors**: Invalid parameters or data
- **API errors**: Superset API-specific errors with full context

## 🏗️ Development

### Project Structure
```
src/
├── index.ts              # Main entry point
├── types/               # TypeScript type definitions
├── client/              # Superset API client
├── handlers/            # MCP request handlers  
├── server/              # Tool and resource definitions
└── utils/               # Utility functions
```

### Adding New Features
1. **New API methods**: Add to `client/superset-client.ts`
2. **New tools**: Define in `server/tools.ts`, implement in `handlers/tool-handlers.ts`
3. **New resources**: Define in `server/resources.ts`, implement in `handlers/resource-handlers.ts`
4. **New types**: Add to `types/index.ts`

### Development Commands
```bash
npm run dev      # Watch mode for development
npm run build    # Build for production
npm run start    # Run built server
npm run inspector # Debug with MCP inspector
```

## 🔗 Related Links

- [Apache Superset](https://superset.apache.org/) - Modern data exploration platform
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol specification
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - SDK documentation
