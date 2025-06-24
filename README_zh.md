# Superset MCP 服务器

一个用于管理 Apache Superset 数据集、指标和 SQL 查询的模型上下文协议 (MCP) 服务器。

## 🚀 功能特性

- **数据集管理**: 完整的 Superset 数据集 CRUD 操作
- **指标管理**: 创建、更新和管理数据集指标
- **SQL 查询执行**: 直接通过 Superset 执行 SQL 查询
- **数据库集成**: 列出和管理数据库连接
- **资源访问**: 通过 MCP 资源浏览数据集、数据库和指标

## 📋 前置要求

- Node.js 18+ 
- 访问 Apache Superset 实例
- 有效的 Superset 凭据（用户名/密码或访问令牌）

## 🛠️ 安装

### 方法 1: 与 Cursor 一起使用（推荐）

#### 1. 添加到 Cursor MCP 配置
将以下配置添加到您的 Cursor MCP 设置文件中：

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

### 方法 2: 本地开发安装

#### 1. 克隆和安装
```bash
git clone <repository-url>
cd superset-mcp
npm install
```

#### 2. 环境配置
创建 `.env` 文件或设置环境变量：

```bash
# 必需
export SUPERSET_BASE_URL="http://localhost:8088"

# 身份验证（选择一种方法）
# 方法 1: 用户名/密码
export SUPERSET_USERNAME="your_username"
export SUPERSET_PASSWORD="your_password"

# 方法 2: 访问令牌
export SUPERSET_ACCESS_TOKEN="your_access_token"

# 可选
export SUPERSET_AUTH_PROVIDER="db"  # 选项: db, ldap, oauth
```

#### 3. 构建和运行
```bash
npm run build
npm start
```

## 🔧 可用工具

### 数据集操作
| 工具 | 描述 |
|------|-------------|
| `list_datasets` | 获取所有数据集的分页列表 |
| `get_dataset` | 获取特定数据集的详细信息 |
| `create_dataset` | 创建新数据集 |
| `update_dataset` | 更新现有数据集属性 |
| `delete_dataset` | 删除数据集 |
| `refresh_dataset_schema` | 从源刷新数据集架构 |

### 指标操作
| 工具 | 描述 |
|------|-------------|
| `get_dataset_metrics` | 获取数据集的所有指标 |
| `create_dataset_metric` | 创建新指标 |
| `update_dataset_metric` | 更新现有指标 |
| `delete_dataset_metric` | 删除指标 |

### 计算列操作
| 工具 | 描述 |
|------|-------------|
| `get_dataset_columns` | 获取列信息（包括计算列） |
| `create_calculated_column` | 创建新计算列 |
| `update_calculated_column` | 更新现有计算列 |
| `delete_calculated_column` | 删除计算列 |

### SQL 操作
| 工具 | 描述 |
|------|-------------|
| `execute_sql` | 执行带结果限制的 SQL 查询 |

### 数据库操作
| 工具 | 描述 |
|------|-------------|
| `list_databases` | 获取所有配置的数据库连接 |

### 图表操作
| 工具 | 描述 |
|------|-------------|
| `get_chart_params` | 获取图表的可视化参数（先调用此工具） |
| `update_chart_params` | 更新图表可视化参数（在 get_chart_params 之后调用） |

## 📚 资源

通过 MCP 资源访问只读概览：

- `superset://datasets` - 所有数据集概览
- `superset://databases` - 数据库连接列表  
- `superset://dataset-metrics` - 跨数据集的所有指标概览

## 💡 使用示例

### 数据集管理

#### 创建数据集
```json
{
  "tool": "create_dataset",
  "arguments": {
    "database_id": 1,
    "table_name": "sales_data",
    "schema": "public",
    "description": "销售交易数据"
  }
}
```

#### 列出数据集
```json
{
  "tool": "list_datasets",
  "arguments": {
    "page": 0,
    "pageSize": 20
  }
}
```

### 指标管理

#### 获取列信息（创建指标前）
```json
{
  "tool": "get_dataset_columns",
  "arguments": {
    "dataset_id": 1
  }
}
```

#### 创建指标
```json
{
  "tool": "create_dataset_metric",
  "arguments": {
    "dataset_id": 1,
    "metric_name": "total_revenue",
    "expression": "SUM(amount)",
    "description": "销售总收入",
    "verbose_name": "总收入",
    "d3format": "$,.2f"
  }
}
```

### 计算列管理

#### 创建计算列
```json
{
  "tool": "create_calculated_column",
  "arguments": {
    "dataset_id": 1,
    "column_name": "revenue_per_unit",
    "expression": "price * quantity",
    "type": "NUMERIC",
    "description": "按价格乘以数量计算的收入",
    "verbose_name": "单位收入",
    "filterable": true,
    "groupby": true
  }
}
```

#### 更新计算列
```json
{
  "tool": "update_calculated_column",
  "arguments": {
    "dataset_id": 1,
    "column_id": 45,
    "expression": "(price * quantity) * 1.1",
    "description": "更新的收入计算，包含10%加价",
    "verbose_name": "单位收入（含加价）"
  }
}
```

#### 删除计算列
```json
{
  "tool": "delete_calculated_column",
  "arguments": {
    "dataset_id": 1,
    "column_id": 45
  }
}
```

### SQL 查询执行

#### 基本查询
```json
{
  "tool": "execute_sql",
  "arguments": {
    "database_id": 1,
    "sql": "SELECT COUNT(*) FROM users WHERE active = true"
  }
}
```

#### 带参数的高级查询
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

### 图表可视化管理

#### 获取图表可视化参数（步骤 1）
```json
{
  "tool": "get_chart_params",
  "arguments": {
    "chart_id": 123
  }
}
```

#### 更新图表可视化参数（步骤 2）
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

**注意**: 始终先调用 `get_chart_params` 查看当前配置，然后再更新。params 的结构取决于图表的 `viz_type`。

## 📖 API 参考

### 指标字段参考
| 字段 | 类型 | 必需 | 描述 |
|-------|------|----------|-------------|
| `metric_name` | string | ✅ | 唯一指标标识符 |
| `expression` | string | ✅ | 指标的 SQL 表达式 |
| `metric_type` | string | ❌ | 指标类型（如 'count', 'sum'） |
| `description` | string | ❌ | 人类可读的描述 |
| `verbose_name` | string | ❌ | UI 中的显示名称 |
| `d3format` | string | ❌ | 显示用的 D3.js 格式字符串 |
| `warning_text` | string | ❌ | 用户警告消息 |
| `extra` | string | ❌ | 附加配置（JSON） |
| `is_restricted` | boolean | ❌ | 访问限制标志 |

### 计算列字段参考
| 字段 | 类型 | 必需 | 描述 |
|-------|------|----------|-------------|
| `column_name` | string | ✅ | 唯一列标识符 |
| `expression` | string | ✅ | 计算列的 SQL 表达式 |
| `type` | string | ❌ | 数据类型（如 'VARCHAR', 'NUMERIC', 'TIMESTAMP'） |
| `description` | string | ❌ | 人类可读的描述 |
| `verbose_name` | string | ❌ | UI 中的显示名称 |
| `filterable` | boolean | ❌ | 列是否可用于过滤 |
| `groupby` | boolean | ❌ | 列是否可用于分组 |
| `is_dttm` | boolean | ❌ | 是否为日期时间列 |
| `is_active` | boolean | ❌ | 列是否处于活跃状态 |
| `extra` | string | ❌ | 附加配置（JSON） |
| `advanced_data_type` | string | ❌ | 高级数据类型规范 |
| `python_date_format` | string | ❌ | 日期时间列的 Python 日期格式 |

### SQL 执行参数
| 参数 | 类型 | 必需 | 默认值 | 描述 |
|-----------|------|----------|---------|-------------|
| `database_id` | number | ✅ | - | 目标数据库 ID |
| `sql` | string | ✅ | - | 要执行的 SQL 查询 |
| `schema` | string | ❌ | - | 数据库架构 |
| `limit` | number | ❌ | 1000 | 返回的最大行数 |
| `expand_data` | boolean | ❌ | true | 是否展开结果数据 |
| `display_rows` | number | ❌ | 50 | 预览中显示的行数 |

## 🔍 错误处理

服务器提供全面的错误处理和详细消息：

- **身份验证错误**: 无效凭据或过期令牌
- **权限错误**: 访问权限不足
- **验证错误**: 无效参数或数据
- **API 错误**: 带完整上下文的 Superset API 特定错误

## 🏗️ 开发

### 项目结构
```
src/
├── index.ts              # 主入口点
├── types/               # TypeScript 类型定义
├── client/              # Superset API 客户端
├── handlers/            # MCP 请求处理器  
├── server/              # 工具和资源定义
└── utils/               # 实用函数
```

### 添加新功能
1. **新 API 方法**: 添加到 `client/superset-client.ts`
2. **新工具**: 在 `server/tools.ts` 中定义，在 `handlers/tool-handlers.ts` 中实现
3. **新资源**: 在 `server/resources.ts` 中定义，在 `handlers/resource-handlers.ts` 中实现
4. **新类型**: 添加到 `types/index.ts`

### 开发命令
```bash
npm run dev      # 开发监视模式
npm run build    # 生产构建
npm run start    # 运行构建的服务器
npm run inspector # 使用 MCP 检查器调试
```

## 🔗 相关链接

- [Apache Superset](https://superset.apache.org/) - 现代数据探索平台
- [模型上下文协议](https://modelcontextprotocol.io/) - 协议规范
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - SDK 文档 