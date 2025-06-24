# Superset MCP Server

A Model Context Protocol (MCP) server for managing Apache Superset datasets, metrics, and SQL queries.

> 📖 [中文文档](README_zh.md)

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

### Calculated Columns Operations
| Tool | Description |
|------|-------------|
| `get_dataset_columns` | Get column information (including calculated columns) |
| `create_calculated_column` | Create a new calculated column |
| `update_calculated_column` | Update existing calculated column |
| `delete_calculated_column` | Delete a calculated column |

### SQL Operations
| Tool | Description |
|------|-------------|
| `execute_sql` | Execute SQL queries with result limiting |

### Database Operations
| Tool | Description |
|------|-------------|
| `list_databases` | Get all configured database connections |

### Chart Operations
| Tool | Description |
|------|-------------|
| `list_charts` | Get paginated list of all charts with filtering and sorting |
| `get_chart_params` | Get visualization parameters of a chart (call this FIRST) |
| `update_chart_params` | Update chart visualization parameters (call AFTER get_chart_params) |

### Dashboard Operations
| Tool | Description |
|------|-------------|
| `list_dashboards` | Get paginated list of all dashboards with filtering and sorting |
| `get_dashboard_charts` | Get all charts in a specific dashboard with their information |
| `get_dashboard_filters` | Get dashboard's filter configuration (native filters, global filters) |
| `get_dashboard_chart_query_context` | Get complete query context for a chart in dashboard (dataset ID, used metrics with SQL expressions, calculated columns, applied filters) |

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

### Calculated Columns Management

#### Create a Calculated Column
```json
{
  "tool": "create_calculated_column",
  "arguments": {
    "dataset_id": 1,
    "column_name": "revenue_per_unit",
    "expression": "price * quantity",
    "type": "NUMERIC",
    "description": "Revenue calculated as price multiplied by quantity",
    "verbose_name": "Revenue Per Unit",
    "filterable": true,
    "groupby": true
  }
}
```

#### Update a Calculated Column
```json
{
  "tool": "update_calculated_column",
  "arguments": {
    "dataset_id": 1,
    "column_id": 45,
    "expression": "(price * quantity) * 1.1",
    "description": "Updated revenue calculation with 10% markup",
    "verbose_name": "Revenue Per Unit (with markup)"
  }
}
```

#### Delete a Calculated Column
```json
{
  "tool": "delete_calculated_column",
  "arguments": {
    "dataset_id": 1,
    "column_id": 45
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
    "display_rows": 50
  }
}
```

### Chart Management

#### List Charts
```json
{
  "tool": "list_charts",
  "arguments": {
    "page": 0,
    "page_size": 20,
    "order_column": "changed_on_dttm",
    "order_direction": "desc"
  }
}
```

#### List Charts with Filters
```json
{
  "tool": "list_charts",
  "arguments": {
    "page": 0,
    "page_size": 10,
    "filters": [
      {
        "col": "viz_type",
        "opr": "eq",
        "value": "table"
      },
      {
        "col": "slice_name",
        "opr": "like",
        "value": "%sales%"
      }
    ],
    "order_column": "slice_name",
    "order_direction": "asc"
  }
}
```

### Chart Visualization Management

#### Get Chart Visualization Parameters (Step 1)
```json
{
  "tool": "get_chart_params",
  "arguments": {
    "chart_id": 123
  }
}
```

#### Update Chart Visualization Parameters (Step 2)
```json
{
  "tool": "update_chart_params",
  "arguments": {
    "chart_id": 123,
    "params": {
      "color_scheme": "supersetColors",
      "show_legend": true,
      "x_axis_format": "smart_date",
      "y_axis_format": "$,.2f",
      "show_bar_value": true,
      "bar_stacked": false,
      "order_bars": true
    }
  }
}
```

**Note**: Always call `get_chart_params` first to see the current configuration before updating. The params structure varies based on the chart's `viz_type`.

### Dashboard Management

#### List Dashboards
```json
{
  "tool": "list_dashboards",
  "arguments": {
    "page": 0,
    "page_size": 20,
    "order_column": "changed_on_dttm",
    "order_direction": "desc"
  }
}
```

#### List Dashboards with Filters
```json
{
  "tool": "list_dashboards",
  "arguments": {
    "page": 0,
    "page_size": 10,
    "filters": [
      {
        "col": "published",
        "opr": "eq",
        "value": true
      },
      {
        "col": "dashboard_title",
        "opr": "like",
        "value": "%sales%"
      }
    ],
    "order_column": "dashboard_title",
    "order_direction": "asc"
  }
}
```

#### Get All Charts in a Dashboard
```json
{
  "tool": "get_dashboard_charts",
  "arguments": {
    "dashboard_id": 5
  }
}
```

#### Get Dashboard Filter Configuration
```json
{
  "tool": "get_dashboard_filters",
  "arguments": {
    "dashboard_id": 5
  }
}
```

#### Get Complete Chart Query Context from Dashboard
```json
{
  "tool": "get_dashboard_chart_query_context",
  "arguments": {
    "dashboard_id": 5,
    "chart_id": 123
  }
}
```

This tool provides the most comprehensive information about how a chart behaves within a specific dashboard, including:
- Chart's dataset ID and detailed dataset information (table name, schema, database)
- Used metrics with their SQL expressions (both predefined and ad-hoc metrics)
- Calculated columns with their expressions from the dataset
- Chart's default visualization parameters
- All dashboard-level filters (native filters, global filters) that apply to the chart
- Final merged query context that combines chart settings with dashboard filters

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

### Calculated Column Field Reference
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `column_name` | string | ✅ | Unique column identifier |
| `expression` | string | ✅ | SQL expression for the calculated column |
| `type` | string | ❌ | Data type (e.g., 'VARCHAR', 'NUMERIC', 'TIMESTAMP') |
| `description` | string | ❌ | Human-readable description |
| `verbose_name` | string | ❌ | Display name in UI |
| `filterable` | boolean | ❌ | Whether column can be used for filtering |
| `groupby` | boolean | ❌ | Whether column can be used for grouping |
| `is_dttm` | boolean | ❌ | Whether this is a datetime column |
| `is_active` | boolean | ❌ | Whether the column is active |
| `extra` | string | ❌ | Additional configuration (JSON) |
| `advanced_data_type` | string | ❌ | Advanced data type specification |
| `python_date_format` | string | ❌ | Python date format for datetime columns |

### SQL Execution Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `database_id` | number | ✅ | - | Target database ID |
| `sql` | string | ✅ | - | SQL query to execute |
| `schema` | string | ❌ | - | Database schema |
| `limit` | number | ❌ | 1000 | Maximum rows to return |
| `expand_data` | boolean | ❌ | true | Whether to expand result data |
| `display_rows` | number | ❌ | 50 | Rows to show in preview |

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
