/** 研发中心工作台 · 核心数据契约 */

export type GroupKind = "dept" | "group";

export interface OrgSection {
  /** 科室 id，如 dev-ke */
  id: string;
  name: string;
}

export interface OrgGroup {
  /** 部门 / 公共分组 id，如 dept-dev、g-platform */
  id: string;
  name: string;
  /** dept = 组织架构里的「部」；group = 跨部门公共分组 */
  kind: GroupKind;
  sections: OrgSection[];
  desc?: string;
  /** 展示顺序 */
  order: number;
}

export type AppType = "internal" | "platform" | "external";
export type AppStatus = "active" | "maintenance" | "offline";

/** 图标色调：使用 token 名，避免组件里散落硬编码色值 */
export type GlyphColor = "ink" | "grape" | "sky" | "mint" | "peach" | "rose" | "sea";

/** 分组柔彩：同一色系贯穿标签、图标与统计条 */
export interface GroupTone {
  text: string;
  bg: string;
  soft: string;
  dot: string;
}

export interface WorkApp {
  id: string;
  name: string;
  /** 完整访问地址；internal 类型由 host + port + path 拼装 */
  url: string;
  groupId: string;
  /** 所属科室；公共分组为空串 */
  sectionId: string;
  type: AppType;
  status: AppStatus;
  /** 一句话说明 */
  desc?: string;
  /** 负责人 / 团队 */
  owner?: string;
  tags: string[];
  glyph: GlyphColor;
  /** 需要连接公司网络才能访问 */
  intranet?: boolean;
  enabled: boolean;
  favorite?: boolean;
  /** internal 类型的原始端口信息，便于后期统一集成 */
  host?: string;
  port?: string;
  path?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StatEntry {
  count: number;
  lastAt: number;
}

export interface UsageStat {
  /** key: yyyy-MM-dd */
  days: Record<string, StatEntry>;
}

export interface WorkspaceData {
  version: number;
  groups: OrgGroup[];
  apps: WorkApp[];
  /** 收藏的应用 id，顺序即置顶顺序 */
  favorites: string[];
  /** 最近使用：应用 id + 时间戳，倒序，最多 20 条 */
  recent: { id: string; at: number }[];
  /** appId -> 使用统计 */
  stats: Record<string, UsageStat>;
}

export const APP_TYPE_LABEL: Record<AppType, string> = {
  internal: "内部服务",
  platform: "公司平台",
  external: "外部网站",
};

export const STATUS_LABEL: Record<AppStatus, string> = {
  active: "正常",
  maintenance: "维护中",
  offline: "已停用",
};
