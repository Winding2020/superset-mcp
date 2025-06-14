# Superset MCP 模块结构

本项目已经模块化，代码结构如下：

## 目录结构

```
src/
├── index.ts                    # 主入口文件
├── types/
│   └── index.ts               # 类型定义
├── utils/
│   └── error.ts               # 错误处理工具
├── client/
│   ├── index.ts               # 客户端导出
│   └── superset-client.ts     # Superset API客户端
├── handlers/
│   ├── tool-handlers.ts       # 工具处理器
│   └── resource-handlers.ts   # 资源处理器
└── server/
    ├── tools.ts               # 工具定义
    └── resources.ts           # 资源定义
```

## 模块说明

### `types/` - 类型定义
- `SupersetConfig`: Superset客户端配置接口
- `Dataset`: Dataset数据结构
- `DatasetMetric`: Dataset Metric数据结构
- `DatasetColumn`: Dataset列信息
- `DatasetListResponse`: API响应类型
- `CsrfTokenResponse`: CSRF令牌响应

### `utils/` - 工具函数
- `getErrorMessage()`: 统一的错误处理函数

### `client/` - Superset客户端
- `SupersetClient`: 主要的API客户端类，包含所有与Superset API交互的方法
- `initializeSupersetClient()`: 客户端初始化函数

### `handlers/` - MCP处理器
- `handleToolCall()`: 处理所有工具调用请求
- `handleResourceRead()`: 处理所有资源读取请求

### `server/` - 服务器配置
- `toolDefinitions`: 所有工具的定义和schema
- `resourceDefinitions`: 所有资源的定义

### `index.ts` - 主入口
- 创建MCP服务器
- 注册请求处理器
- 启动服务器

## 优势

1. **模块化**: 代码按功能分离，易于维护和扩展
2. **类型安全**: 统一的类型定义，减少类型错误
3. **可测试性**: 每个模块可以独立测试
4. **可扩展性**: 新功能可以轻松添加到相应模块
5. **代码复用**: 客户端和工具函数可以在不同地方复用

## 添加新功能

1. **新的API方法**: 在 `client/superset-client.ts` 中添加
2. **新的工具**: 在 `server/tools.ts` 中定义，在 `handlers/tool-handlers.ts` 中实现
3. **新的资源**: 在 `server/resources.ts` 中定义，在 `handlers/resource-handlers.ts` 中实现
4. **新的类型**: 在 `types/index.ts` 中添加 