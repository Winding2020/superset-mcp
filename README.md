# Superset Dataset MCP Server

一个用于管理Apache Superset数据集和指标的MCP（Model Context Protocol）服务器。

## 功能特性

### Dataset管理
- 列出所有datasets
- 获取单个dataset详细信息
- 创建新dataset
- 更新dataset
- 删除dataset
- 刷新dataset schema

### Dataset Metrics管理 ✨ 新功能
- 获取dataset的所有metrics
- 创建新的metric
- 更新现有metric
- 删除metric

### SQL查询执行 🚀 新功能
- 使用/api/v1/sqllab/execute/端点执行SQL查询
- 支持同步执行
- 支持结果限制和数据展开

### 数据库管理
- 列出所有数据库连接

## 安装和使用

### 环境变量配置

```bash
export SUPERSET_BASE_URL="http://localhost:8088"
export SUPERSET_USERNAME="your_username"
export SUPERSET_PASSWORD="your_password"
# 或者使用访问令牌
export SUPERSET_ACCESS_TOKEN="your_access_token"
```

### 构建和运行

```bash
npm install
npm run build
node build/index.js
```

## 可用工具

### Dataset工具
- `list_datasets` - 获取datasets列表
- `get_dataset` - 获取单个dataset详情
- `create_dataset` - 创建新dataset
- `update_dataset` - 更新dataset
- `delete_dataset` - 删除dataset
- `refresh_dataset_schema` - 刷新dataset schema

### Dataset Metrics工具 ✨ 新功能
- `get_dataset_metrics` - 获取指定dataset的所有metrics
- `create_dataset_metric` - 为dataset创建新的metric
- `update_dataset_metric` - 更新dataset中的metric
- `delete_dataset_metric` - 删除dataset中的metric
- `get_dataset_columns` - 获取dataset的字段信息（创建metrics时参考）

### SQL查询工具 🚀 新功能
- `execute_sql` - 使用/api/v1/sqllab/execute/端点执行SQL查询

### 数据库工具
- `list_databases` - 获取数据库列表

## 可用资源

- `superset://datasets` - Superset Datasets概览
- `superset://databases` - Superset数据库列表
- `superset://dataset-metrics` - Dataset Metrics概览 ✨ 新功能

## SQL查询执行使用示例 🚀 新功能

### 基本SQL查询
```json
{
  "tool": "execute_sql",
  "arguments": {
    "database_id": 1,
    "sql": "SELECT * FROM sales LIMIT 10"
  }
}
```

### 带schema的查询
```json
{
  "tool": "execute_sql",
  "arguments": {
    "database_id": 1,
    "sql": "SELECT COUNT(*) as total_records FROM public.users",
    "schema": "public",
    "limit": 1000
  }
}
```

## SQL执行参数说明

- `database_id` - 数据库ID（必需）
- `sql` - 要执行的SQL查询语句（必需）
- `schema` - 数据库schema（可选）
- `limit` - 查询结果行数限制（默认1000）
- `expand_data` - 是否展开数据（默认true）

## Dataset Metrics使用示例

### 获取dataset的字段信息（创建metrics前的准备）
```json
{
  "tool": "get_dataset_columns",
  "arguments": {
    "dataset_id": 1
  }
}
```

### 获取dataset的metrics
```json
{
  "tool": "get_dataset_metrics",
  "arguments": {
    "dataset_id": 1
  }
}
```

### 创建新metric
```json
{
  "tool": "create_dataset_metric",
  "arguments": {
    "dataset_id": 1,
    "metric_name": "total_sales",
    "expression": "SUM(sales_amount)",
    "description": "总销售额",
    "verbose_name": "总销售额",
    "d3format": ",.2f"
  }
}
```

### 更新metric
```json
{
  "tool": "update_dataset_metric",
  "arguments": {
    "dataset_id": 1,
    "metric_id": 5,
    "expression": "SUM(sales_amount * 1.1)",
    "description": "总销售额（含税）"
  }
}
```

### 删除metric
```json
{
  "tool": "delete_dataset_metric",
  "arguments": {
    "dataset_id": 1,
    "metric_id": 5
  }
}
```

## Metric字段说明

- `metric_name` - Metric名称（必需）
- `expression` - SQL表达式（必需）
- `metric_type` - Metric类型（可选）
- `description` - 描述（可选）
- `verbose_name` - 显示名称（可选）
- `warning_text` - 警告文本（可选）
- `d3format` - D3格式化字符串（可选）
- `extra` - 额外配置（可选）
- `is_restricted` - 是否受限（可选）

## 错误处理

所有API调用都包含适当的错误处理，会返回详细的错误信息以帮助调试。

## 许可证

MIT License

## 贡献

欢迎提交问题和拉取请求！

## 相关链接

- [Apache Superset](https://superset.apache.org/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)