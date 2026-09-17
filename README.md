# Ebara Workbench

研发中心工作台 - 集中管理内部工具、平台和外部网站入口的纯前端单页应用。

## 功能特性

- **应用管理** - 增删改查，支持内部服务 / 公司平台 / 外部网站三种类型
- **组织架构** - 按部门（研发 / 生产 / 技术）和科室分组，另有跨部门公共分组
- **收藏与统计** - 收藏常用应用、记录访问次数和最近使用
- **导入导出** - 配置可 JSON 导出/导入，支持合并或替换模式
- **主题切换** - 支持亮色 / 暗色主题
- **搜索** - 快捷搜索应用，支持 `Ctrl+K` 唤起

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 路由 | TanStack Router（文件路由） |
| UI | Radix UI + Tailwind CSS 4 + shadcn/ui |
| 状态 | React Context + localStorage |
| 构建 | Vite 7 |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

开发服务器默认运行在 http://localhost:3015

### TypeScript 检查

```bash
pnpm typecheck
```

## 项目结构

```
src/
├── components/          # 组件
│   ├── ui/              # shadcn/ui 基础组件
│   ├── builtins/        # 内置工具组件
│   ├── AppCard.tsx      # 应用卡片
│   ├── AppForm.tsx      # 应用表单
│   ├── GroupTabs.tsx    # 分组标签
│   ├── GroupView.tsx    # 分组视图
│   ├── LayoutShell.tsx  # 布局壳
│   ├── SearchPalette.tsx # 搜索面板
│   └── TopBar.tsx       # 顶部栏
├── hooks/               # 自定义 Hooks
├── lib/                 # 核心逻辑
│   ├── types.ts         # 数据类型定义
│   ├── store.tsx        # 状态管理
│   ├── seed.ts          # 初始数据
│   ├── logo.ts          # 图标处理
│   └── utils.ts         # 工具函数
├── routes/              # 路由页面
│   ├── __root.tsx       # 根布局
│   ├── _layout.tsx      # 主布局
│   ├── _layout.index.tsx # 首页
│   ├── _layout.apps.tsx # 全部应用
│   └── ...
└── styles.css           # 全局样式
```

## 数据存储

数据存储在浏览器 `localStorage` 中，包含：
- 应用清单
- 分组与科室配置
- 收藏列表
- 最近使用记录
- 访问统计

> **注意**：数据不会跨浏览器同步。如需多人共享，请使用导入/导出功能。

## 部署

构建产物为静态文件，可直接部署到 Nginx / IIS / Vercel / Netlify 等：

```bash
pnpm build
# 将 dist/ 目录部署到静态服务器
```

## License

MIT
