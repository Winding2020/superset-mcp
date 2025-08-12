# Superset MCP 服务器

一个用于管理 Apache Superset 数据集、指标和 SQL 查询的模型上下文协议 (MCP) 服务器。

> 📖 [English Documentation](README.md)

## 🚀 功能特性

- **数据集管理**：对 Superset 数据集的完整 CRUD 操作
- **指标管理**：创建、更新和管理数据集指标
- **计算列**：为数据集创建和管理计算列
- **图表管理**：查看和修改图表可视化参数和过滤器
- **仪表板操作**：访问仪表板信息、图表和过滤器
- **SQL 查询执行**：直接通过 Superset 执行 SQL 查询
- **数据库集成**：列出和管理数据库连接
- **资源访问**：通过 MCP 资源浏览数据集、数据库和指标

## 📋 先决条件

- Node.js 18+ 
- 访问 Apache Superset 实例
- 有效的 Superset 凭据（用户名/密码或访问令牌）

## 🛠️ 安装

### 与 Cursor 或 Claude Desktop 一起使用

#### 1. 添加到 MCP 配置
将以下配置添加到您的 MCP 设置文件中：

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

#### 2. 环境变量
通过更新 MCP 配置中的 `env` 部分来配置您的 Superset 连接：

```json
"env": {
  "SUPERSET_BASE_URL": "your-superset-url",
  "SUPERSET_USERNAME": "your_username",
  "SUPERSET_PASSWORD": "your_password",
}
```

**替代方案：使用访问令牌**
```json
"env": {
  "SUPERSET_BASE_URL": "your-superset-url",
  "SUPERSET_ACCESS_TOKEN": "your_access_token"
}
```

## 🔧 可用工具

### 数据集操作
| 工具 | 描述 |
|------|-------------|
| `list_datasets` | 获取带有过滤和排序的所有数据集分页列表 |
| `get_dataset` | 获取特定数据集的详细信息 |
| `create_dataset` | 创建新数据集（物理或带 SQL 的虚拟数据集） |
| `update_dataset` | 更新现有数据集属性 |
| `delete_dataset` | 删除数据集 |
| `refresh_dataset_schema` | 从源数据库刷新数据集架构 |
| `find_and_replace_in_sql` | 在虚拟数据集 SQL 中查找和替换文本 |

### 指标操作
| 工具 | 描述 |
|------|-------------|
| `get_dataset_metrics` | 获取数据集的所有指标 |
| `create_dataset_metric` | 使用 SQL 表达式创建新指标 |
| `update_dataset_metric` | 更新现有指标属性 |
| `delete_dataset_metric` | 删除指标 |

### 计算列操作
| 工具 | 描述 |
|------|-------------|
| `get_dataset_columns` | 获取列信息（包括计算列） |
| `create_calculated_column` | 使用 SQL 表达式创建新的计算列 |
| `update_calculated_column` | 更新现有计算列 |
| `delete_calculated_column` | 删除计算列 |

### 图表操作
| 工具 | 描述 |
|------|-------------|
| `list_charts` | 获取带有过滤和排序的所有图表分页列表 |
| `create_chart` | 创建新图表；多数可视化类型需先调用 `get_chart_params` 获取正确的参数结构 |
| `get_chart_params` | 获取图表可视化类型所需的参数格式 |
| `get_current_chart_config` | 获取图表的完整配置信息（可视化参数、关系、所有权、查询上下文） |
| `update_chart` | 更新图表属性（元数据、数据源、可视化参数） |
| `get_chart_filters` | 获取应用于图表的当前数据过滤器 |
| `set_chart_filters` | 为图表设置数据过滤器（永久更新图表） |

### 仪表板操作
| 工具 | 描述 |
|------|-------------|
| `list_dashboards` | 获取带有过滤和排序的所有仪表板分页列表 |
| `get_dashboard_charts` | 获取特定仪表板中的所有图表及其信息 |
| `get_dashboard_filters` | 获取仪表板的过滤器配置（原生过滤器、全局过滤器） |
| `get_dashboard_chart_query_context` | 获取仪表板中图表的完整查询上下文（数据集 ID、使用的指标及其 SQL 表达式、计算列、应用的过滤器） |

### SQL 操作
| 工具 | 描述 |
|------|-------------|
| `execute_sql` | 执行带有结果限制和数据显示的 SQL 查询 |

### 数据库操作
| 工具 | 描述 |
|------|-------------|
| `list_databases` | 获取所有已配置的数据库连接 |

## 📚 资源

通过 MCP 资源访问只读概览：

- `superset://datasets` - 所有数据集概览
- `superset://databases` - 数据库连接列表  
- `superset://dataset-metrics` - 所有数据集中指标的概览


## Prompt 示例

以下是可以直接用于与 MCP 助手交互的自然语言示例，助手会自动选择合适的工具并补全参数：

- 列出数据集
  - “显示最近变更的前 10 个数据集，只包含 id 和 table_name。”

- 创建图表
  - “用数据集 12 创建一个名为 ‘Sample Table’ 的表格图。”

- 更新图表
  - “把 42 号图表改成按国家分组的柱状图，使用 SUM(value) 指标。”

- 仪表板查询上下文
  - “在 ‘sales-kpi’ 仪表板里，展示 101 号图表的完整查询上下文。”

- 运行 SQL
  - “在数据库 3 上，查询最近创建的 10 个用户，返回 id 和 name，并按创建时间从新到旧排序。”
