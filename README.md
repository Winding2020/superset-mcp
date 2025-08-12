# Superset MCP Server

A Model Context Protocol (MCP) server for managing Apache Superset datasets, metrics, and SQL queries.

> 📖 [中文文档](README_zh.md)

## 🚀 Features

- **Dataset Management**: Full CRUD operations for Superset datasets
- **Metrics Management**: Create, update, and manage dataset metrics
- **Calculated Columns**: Create and manage calculated columns for datasets
- **Chart Management**: View and modify chart visualization parameters and filters
- **Dashboard Operations**: Access dashboard information, charts, and filters
- **SQL Query Execution**: Execute SQL queries directly through Superset
- **Database Integration**: List and manage database connections
- **Resource Access**: Browse datasets, databases, and metrics through MCP resources

## 📋 Prerequisites

- Node.js 18+ 
- Access to an Apache Superset instance
- Valid Superset credentials (username/password or access token)

## 🛠️ Installation

### Using with Cursor or Claude Desktop

#### 1. Add to MCP Configuration
Add the following configuration to your MCP settings file:

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

## 🔧 Available Tools

### Dataset Operations
| Tool | Description |
|------|-------------|
| `list_datasets` | Get paginated list of all datasets with filtering and sorting |
| `get_dataset` | Get detailed information for a specific dataset |
| `create_dataset` | Create a new dataset (physical or virtual with SQL) |
| `update_dataset` | Update existing dataset properties |
| `delete_dataset` | Delete a dataset |
| `refresh_dataset_schema` | Refresh dataset schema from source database |
| `find_and_replace_in_sql` | Find and replace text in virtual dataset SQL |

### Metrics Operations
| Tool | Description |
|------|-------------|
| `get_dataset_metrics` | Get all metrics for a dataset |
| `create_dataset_metric` | Create a new metric with SQL expression |
| `update_dataset_metric` | Update existing metric properties |
| `delete_dataset_metric` | Delete a metric |

### Calculated Columns Operations
| Tool | Description |
|------|-------------|
| `get_dataset_columns` | Get column information (including calculated columns) |
| `create_calculated_column` | Create a new calculated column with SQL expression |
| `update_calculated_column` | Update existing calculated column |
| `delete_calculated_column` | Delete a calculated column |

### Chart Operations
| Tool | Description |
|------|-------------|
| `list_charts` | Get paginated list of all charts with filtering and sorting |
| `create_chart` | Create a new chart; for most viz types you should first call `get_chart_params` to obtain the correct params schema |
| `get_chart_params` | Get required parameters format for chart visualization types |
| `get_current_chart_config` | Get current chart configuration details (viz params, relationships, ownership, query context) |
| `update_chart` | Update chart properties including metadata, datasource, and visualization parameters |
| `get_chart_filters` | Get current data filters applied to a chart |
| `set_chart_filters` | Set data filters for a chart (permanently updates the chart) |

### Dashboard Operations
| Tool | Description |
|------|-------------|
| `list_dashboards` | Get paginated list of all dashboards with filtering and sorting |
| `get_dashboard_charts` | Get all charts in a specific dashboard with their information |
| `get_dashboard_filters` | Get dashboard's filter configuration (native filters, global filters) |
| `get_dashboard_chart_query_context` | Get complete query context for a chart in dashboard (dataset ID, used metrics with SQL expressions, calculated columns, applied filters) |

### SQL Operations
| Tool | Description |
|------|-------------|
| `execute_sql` | Execute SQL queries with result limiting and data display |

### Database Operations
| Tool | Description |
|------|-------------|
| `list_databases` | Get all configured database connections |

## 📚 Resources

Access read-only overviews through MCP resources:

- `superset://datasets` - Overview of all datasets
- `superset://databases` - List of database connections  
- `superset://dataset-metrics` - Overview of all metrics across datasets


## Prompt examples

Use these natural prompts with your MCP-enabled assistant; it will pick the right tools and arguments.

- List datasets
  - "Show the first 10 datasets, most recently changed first. Only include id and table_name."

- Create a chart
  - "Create a simple table chart called 'Sample Table' using dataset 12."

- Update a chart
  - "Change chart 42 to a bar chart grouped by country and using SUM(value)."

- Dashboard query context
  - "On the 'sales-kpi' dashboard, show the full query context for chart 101."

- Run SQL
  - "On database 3, fetch the 10 most recently created users, returning only id and name."
