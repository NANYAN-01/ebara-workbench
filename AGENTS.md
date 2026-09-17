\# 研发中心工作台 · 项目上下文



\## Dependencies

\- `sonner`：全局 toast 提示（已在 package.json，非新增）

\- `lucide-react`：图标

\- 无其他第三方运行时依赖；数据持久化使用浏览器 localStorage，未接入任何后端云服务。



\## Architecture

\- \*\*数据层\*\*：

&#x20; - `src/lib/logo.ts` —— favicon 候选源拼装（icon.horse / unavatar / 同域 favicon.ico / favicon.im）+ 手动上传 logo 覆盖（localStorage 命名空间，按应用 id 存 data URL）。`upsertApp` 现返回真实应用 id，供表单保存后写入上传图标。

\- \*\*纯前端单页应用\*\*，形态为内网部署的静态站点（`pnpm run build` → `dist/`，可直接丢进 Nginx / IIS 静态目录）。

\- 路由：TanStack Router 文件路由。`src/routes/\_layout.tsx` 是唯一布局壳（`StoreProvider` + `LayoutShell`），所有业务页面以 `\_layout.\*.tsx` 挂在其下。原模板 `routes/index.tsx` 已删除，首页为 `routes/\_layout.index.tsx`。

\- \*\*数据层\*\*：

&#x20; - `src/lib/types.ts` —— 全部数据契约（OrgGroup / WorkApp / WorkspaceData）。

&#x20; - `src/lib/seed.ts` —— 组织架构与内置应用清单（U9、OA、AI 站、PDF 工具等）。部门内部服务均为「示例记录」，需用户改成真实 IP+端口。

&#x20; - `src/lib/store.tsx` —— `StoreProvider` + `useStore()`，负责 localStorage 读写（key `ebara-workbench:v3`）、主题、增删改查、收藏、最近使用、按自然日聚合的点击统计、导入导出。

&#x20; - `src/lib/layout-context.tsx` —— 把浮层动作（openNew/openEdit/removeApp/openSearch/openImport）从 LayoutShell 下发给子路由，避免 props 层层传递；同时 re-export `useStore`。

\- \*\*浮层编排集中在 `LayoutShell`\*\*：搜索面板、应用表单抽屉、导入弹窗、Toaster 都在此处统一持有 state，子页面只通过 `useWorkspace()` 触发。

\- 视觉系统：马卡龙柔光。`src/styles.css` 定义 oklch token（catppuccin 预设 + 工作台自有语义层 `--surface/--hairline/--subtle/--ok/--warn/--off` + 六色柔彩 `--t-grape/--t-sky/--t-mint/--t-peach/--t-rose/--t-sea`，其中柔彩复用 `--chart-1..5`）；`:root` + `.dark` 两套。分组色贯穿逻辑集中在 `src/lib/group-tone.ts`（`groupColorOf` / `toneOf`），GroupTabs / GroupView / index / stats 只消费该色板，不在组件里散落色值。常驻侧栏已移除，改为 `GroupTabs`（sticky 横向分组标签）+ TopBar 内的组织抽屉。



\## What Didn't Work

\- ❌ 想在 `GroupSection` 里用模块级变量 `\_toggle` 桥接 `toggleFavorite` → 属于跨组件可变闭包，写法脆弱且 TS 报未使用；改为各组件直接 `useStore()` 取 `toggleFavorite`。

\- ❌ 模板 `routes/\_\_root.tsx` 的 `ErrorComponent` 参数类型写成 `{ error: Error }`，与 TanStack Router 的 `ErrorComponentProps`（error 为 unknown）不兼容，`typecheck` 会失败 → 改为 `{ error: unknown }`。



\## Lessons

\- 沙箱预览默认关闭 HMR，改完代码必须重跑 `pnpm run dev` 才会生效。

\- 纯前端无法对内网地址做健康探测（CORS 限制），因此卡片上的「正常/维护中/停用」是\*\*人工标记\*\*，不是探活结果。

\- 统计与收藏都只存在本机浏览器，多人共享同一份清单需要走「导出配置 / 导入配置」，或后续接入后端存储。

\- 内网系统普遍禁止被 iframe 嵌套，所有跳转一律 `window.open(\_blank)`。



