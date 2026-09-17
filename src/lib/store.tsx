import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { DEFAULT_FAVORITES, SEED_APPS, SEED_GROUPS } from "./seed";
import type { GlyphColor, OrgGroup, WorkApp, WorkspaceData } from "./types";

const STORAGE_KEY = "ebara-workbench:v3";
const THEME_KEY = "ebara-workbench:theme";
/** v2 旧版 glyph 色名（slate/steel/amber…）与柔彩契约不兼容，升 key 让其自然回落到新种子 */
const DATA_VERSION = 3;

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 近 N 天的日期键，用于趋势统计 */
export function recentDayKeys(n = 7): string[] {
  return Array.from({ length: n }, (_, i) => todayKey(new Date(Date.now() - (n - 1 - i) * 86_400_000)));
}

function emptyData(): WorkspaceData {
  return {
    version: DATA_VERSION,
    groups: SEED_GROUPS.map((g) => ({ ...g, sections: [...g.sections] })),
    apps: SEED_APPS.map((a) => ({ ...a, tags: [...a.tags] })),
    favorites: [...DEFAULT_FAVORITES],
    recent: [],
    stats: {},
  };
}

/** 旧分组 id → 新分组 id（与 seed 保持一致，兼容历史 localStorage） */
const GROUP_ALIAS: Record<string, string> = {
  "pub-platform": "g-platform",
  "pub-ai": "g-ai",
  "pub-tools": "g-tools",
  "pub-knowledge": "g-docs",
};

/** 旧 kind 值 → 新 GroupKind */
const KIND_ALIAS: Record<string, OrgGroup["kind"]> = {
  department: "dept",
  dept: "dept",
  public: "group",
  group: "group",
};

/** 旧科室 id → 新科室 id（部门分组 id 同步改名） */
const SECTION_GROUP: Record<string, string> = {
  "sec-dev": "dept-dev",
  "sec-prod1": "dept-prod",
  "sec-prod2": "dept-prod",
  "sec-eng": "dept-tech",
  "sec-elec": "dept-tech",
};

/** 旧色调名 → 新柔彩色调（历史 localStorage / 旧导出配置兼容） */
const GLYPH_ALIAS: Record<string, GlyphColor> = {
  slate: "sky",
  steel: "sky",
  amber: "peach",
  energy: "peach",
  moss: "mint",
  ok: "mint",
  rust: "rose",
  warn: "rose",
  primary: "grape",
  off: "sea",
  ink: "ink",
  grape: "grape",
  sky: "sky",
  mint: "mint",
  peach: "peach",
  rose: "rose",
  sea: "sea",
};

function migrateGroups(input: OrgGroup[]): OrgGroup[] {
  const out = input.map((g) => ({
    ...g,
    id: GROUP_ALIAS[g.id] ?? g.id,
    kind: KIND_ALIAS[g.kind] ?? "group",
    sections: Array.isArray(g.sections) ? [...g.sections] : [],
  }));
  // 补种缺失的部门分组：历史数据里可能只有公共分组，或分组被误删
  for (const seed of SEED_GROUPS) {
    if (!out.some((g) => g.id === seed.id)) {
      out.push({ ...seed, sections: [...seed.sections] });
    }
  }
  // 补种缺失的科室，并把应用上残留的旧科室 id 归位
  for (const [sid, gid] of Object.entries(SECTION_GROUP)) {
    const g = out.find((x) => x.id === gid);
    if (g && !g.sections.some((s) => s.id === sid)) {
      const seedSection = SEED_GROUPS.find((x) => x.id === gid)?.sections.find((s) => s.id === sid);
      if (seedSection) g.sections.push({ ...seedSection });
    }
  }
  return out.sort((a, b) => a.order - b.order);
}

function sanitize(raw: unknown): WorkspaceData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<WorkspaceData>;
  if (!Array.isArray(d.apps) || !Array.isArray(d.groups)) return null;
  const groups = migrateGroups(d.groups.filter((g) => g && typeof g.id === "string"));
  const ids = new Set(groups.map((g) => g.id));
  const apps = (d.apps as WorkApp[])
    .filter((a) => a && typeof a.id === "string")
    .map((a) => {
      const gid = GROUP_ALIAS[a.groupId] ?? a.groupId;
      const secGid = a.sectionId ? SECTION_GROUP[a.sectionId] : undefined;
      return {
        ...a,
        groupId: ids.has(gid) ? gid : groups[0]?.id ?? "",
        sectionId: a.sectionId && (!secGid || secGid === gid) ? a.sectionId : "",
        glyph: GLYPH_ALIAS[a.glyph] ?? a.glyph ?? "ink",
      };
    });
  // favorite 标记与 favorites 数组必须同源，任一侧缺失时互补
  const favIds = new Set<string>(Array.isArray(d.favorites) ? d.favorites : []);
  for (const a of apps) if (a.favorite) favIds.add(a.id);
  const favorites = Array.from(favIds).filter((id) => apps.some((a) => a.id === id));
  return {
    version: DATA_VERSION,
    groups,
    apps: apps.map((a) => ({ ...a, favorite: favIds.has(a.id) })),
    favorites,
    recent: Array.isArray(d.recent) ? d.recent.slice(0, 20) : [],
    stats: d.stats && typeof d.stats === "object" ? d.stats : {},
  };
}

function load(): { data: WorkspaceData; fresh: boolean } {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return { data: emptyData(), fresh: true };
    const parsed = sanitize(JSON.parse(text));
    if (!parsed) return { data: emptyData(), fresh: true };
    return { data: parsed, fresh: false };
  } catch {
    return { data: emptyData(), fresh: true };
  }
}

export function newAppId(): string {
  return `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ===================== 对外暴露的状态接口 ===================== */

/** 按自然日聚合的访问记录：days[日期][应用id] = 次数 */
export interface StatsView {
  /** 每个应用的累计点击次数 */
  hits: Record<string, number>;
  /** 每个应用最后一次点击时间 */
  recent: Record<string, { at: number }>;
  /** 日期 → { 应用id → 次数 } */
  days: Record<string, Record<string, number>>;
}

interface StoreValue {
  /* 原始数据 */
  data: WorkspaceData;
  /** 派生快捷视图 */
  apps: WorkApp[];
  orgGroups: OrgGroup[];
  stats: StatsView;
  isFresh: boolean;
  theme: "light" | "dark";

  /* 主题 */
  toggleTheme: () => void;

  /* 应用增删改 */
  upsertApp: (app: Partial<WorkApp> & { name: string; url: string; groupId: string }) => string;
  addApp: (app: Omit<WorkApp, "id" | "createdAt" | "updatedAt">) => WorkApp;
  updateApp: (id: string, patch: Partial<WorkApp>) => void;
  removeApp: (id: string) => void;

  /* 收藏与排序 */
  toggleFavorite: (id: string) => void;
  /** 把 fromId 移到 toId 所在位置 */
  reorderFavorites: (fromId: string, toId: string) => void;

  /* 跳转与统计 */
  launch: (id: string) => void;
  copyText: (text: string) => void;

  /* 科室管理 */
  addSection: (groupId: string, name: string) => void;
  renameSection: (groupId: string, sectionId: string, name: string) => void;
  removeSection: (groupId: string, sectionId: string) => void;

  /* 配置迁移 */
  resetToSeed: () => void;
  exportConfig: () => void;
  importConfig: (incoming: WorkspaceData, mode: "merge" | "replace") => void;

  /* Infinity 设置 */
  updateInfinitySettings: (settings: Partial<import("./types").InfinitySettings>) => void;

  groupById: (id: string) => OrgGroup | undefined;
  sectionName: (groupId: string, sectionId: string | null) => string;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(load, []);
  const [data, setData] = useState<WorkspaceData>(initial.data);
  const [isFresh, setIsFresh] = useState(initial.fresh);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* 隐私模式下写入失败，忽略 */
    }
  }, [data]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  /* ---------- 派生统计视图 ---------- */
  const stats = useMemo<StatsView>(() => {
    const hits: Record<string, number> = {};
    const recent: Record<string, { at: number }> = {};
    const days: Record<string, Record<string, number>> = {};
    for (const [appId, rec] of Object.entries(data.stats)) {
      let total = 0;
      for (const [day, entry] of Object.entries(rec.days ?? {})) {
        const count = typeof entry === "number" ? entry : entry.count;
        const lastAt = typeof entry === "number" ? 0 : entry.lastAt;
        total += count;
        days[day] = { ...(days[day] ?? {}), [appId]: count };
        if (lastAt && (!recent[appId] || lastAt > recent[appId].at)) recent[appId] = { at: lastAt };
      }
      hits[appId] = total;
    }
    // recent 表本身也带时间戳，合并进来保证「最近使用」完整
    for (const r of data.recent) {
      if (!recent[r.id] || r.at > recent[r.id].at) recent[r.id] = { at: r.at };
    }
    return { hits, recent, days };
  }, [data]);

  /* ---------- 应用增删改 ---------- */
  const addApp = useCallback<StoreValue["addApp"]>((app) => {
    const now = Date.now();
    const created: WorkApp = { ...app, id: newAppId(), createdAt: now, updatedAt: now };
    setData((d) => ({ ...d, apps: [created, ...d.apps] }));
    return created;
  }, []);

  const updateApp = useCallback<StoreValue["updateApp"]>((id, patch) => {
    setData((d) => ({
      ...d,
      apps: d.apps.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a)),
    }));
  }, []);

  /** 有 id 则更新，无 id 则新建；同时同步收藏状态 */
  const upsertApp = useCallback<StoreValue["upsertApp"]>((app) => {
    const now = Date.now();
    if (app.id && data.apps.some((a) => a.id === app.id)) {
      const appId = app.id;
      setData((d) => {
        const nextApps = d.apps.map((a) => (a.id === appId ? { ...a, ...app, updatedAt: now } : a));
        const fav = Boolean(app.favorite);
        const existed = d.favorites.includes(appId);
        const favorites = fav ? (existed ? d.favorites : [appId, ...d.favorites]) : d.favorites.filter((f) => f !== appId);
        return { ...d, apps: nextApps, favorites };
      });
      toast.success("已保存修改");
      return app.id;
    }
    const created: WorkApp = {
      ...(app as Omit<WorkApp, "id" | "createdAt" | "updatedAt">),
      id: newAppId(),
      createdAt: now,
      updatedAt: now,
      desc: app.desc ?? "",
      owner: app.owner ?? "",
      tags: app.tags ?? [],
      glyph: app.glyph ?? "ink",
      status: app.status ?? "active",
      intranet: app.intranet ?? false,
      enabled: app.enabled ?? true,
      favorite: app.favorite ?? false,
      sectionId: app.sectionId ?? "",
    };
    setData((d) => ({
      ...d,
      apps: [created, ...d.apps],
      favorites: created.favorite ? [created.id, ...d.favorites] : d.favorites,
    }));
    toast.success("已创建应用");
    return created.id;
  }, [data.apps]);

  const removeApp = useCallback<StoreValue["removeApp"]>((id) => {
    setData((d) => ({
      ...d,
      apps: d.apps.filter((a) => a.id !== id),
      favorites: d.favorites.filter((f) => f !== id),
      recent: d.recent.filter((r) => r.id !== id),
    }));
    toast.success("已删除应用");
  }, []);

  /* ---------- 收藏与拖拽排序 ---------- */
  const toggleFavorite = useCallback<StoreValue["toggleFavorite"]>((id) => {
    setData((d) => {
      const on = d.favorites.includes(id);
      return {
        ...d,
        favorites: on ? d.favorites.filter((f) => f !== id) : [id, ...d.favorites],
        apps: d.apps.map((a) => (a.id === id ? { ...a, favorite: !on } : a)),
      };
    });
  }, []);

  const reorderFavorites = useCallback<StoreValue["reorderFavorites"]>((fromId, toId) => {
    setData((d) => {
      const list = [...d.favorites];
      const from = list.indexOf(fromId);
      const to = list.indexOf(toId);
      if (from < 0 || to < 0 || from === to) return d;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return { ...d, favorites: list };
    });
  }, []);

  /* ---------- 跳转与计数 ---------- */
  const launch = useCallback<StoreValue["launch"]>((id) => {
    const target = data.apps.find((a) => a.id === id);
    if (!target) return;
    window.open(target.url, "_blank", "noopener,noreferrer");
    const key = todayKey();
    setData((d) => {
      const stat = d.stats[id] ?? { days: {} };
      const entry = stat.days[key] ?? { count: 0, lastAt: 0 };
      return {
        ...d,
        stats: {
          ...d.stats,
          [id]: { days: { ...stat.days, [key]: { count: entry.count + 1, lastAt: Date.now() } } },
        },
        recent: [{ id, at: Date.now() }, ...d.recent.filter((r) => r.id !== id)].slice(0, 20),
      };
    });
  }, [data.apps]);

  const copyText = useCallback<StoreValue["copyText"]>(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("地址已复制");
    } catch {
      toast.error("浏览器拒绝了剪贴板访问，请手动复制");
    }
  }, []);

  /* ---------- 科室管理 ---------- */
  const addSection = useCallback<StoreValue["addSection"]>((groupId, name) => {
    setData((d) => ({
      ...d,
      groups: d.groups.map((g) =>
        g.id === groupId ? { ...g, sections: [...g.sections, { id: `sec-${Date.now().toString(36)}`, name }] } : g,
      ),
    }));
    toast.success(`已添加科室「${name}」`);
  }, []);

  const renameSection = useCallback<StoreValue["renameSection"]>((groupId, sectionId, name) => {
    setData((d) => ({
      ...d,
      groups: d.groups.map((g) =>
        g.id === groupId ? { ...g, sections: g.sections.map((s) => (s.id === sectionId ? { ...s, name } : s)) } : g,
      ),
    }));
  }, []);

  const removeSection = useCallback<StoreValue["removeSection"]>((groupId, sectionId) => {
    setData((d) => ({
      ...d,
      groups: d.groups.map((g) => (g.id === groupId ? { ...g, sections: g.sections.filter((s) => s.id !== sectionId) } : g)),
      apps: d.apps.map((a) => (a.groupId === groupId && a.sectionId === sectionId ? { ...a, sectionId: "" } : a)),
    }));
    toast.success("已删除科室，其下应用改为未指定科室");
  }, []);

  /* ---------- 配置迁移 ---------- */
  const resetToSeed = useCallback(() => {
    if (!window.confirm("恢复默认清单？被改动过的内置应用会还原，你自己新增的应用会保留。")) return;
    setData((d) => {
      const seed = emptyData();
      const seedIds = new Set(seed.apps.map((a) => a.id));
      const custom = d.apps.filter((a) => !seedIds.has(a.id));
      return { ...seed, apps: [...custom, ...seed.apps], favorites: d.favorites.length ? d.favorites : seed.favorites };
    });
    setIsFresh(false);
    toast.success("已恢复默认清单");
  }, []);

  const exportConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `研发中心工作台-配置-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${data.apps.length} 个应用的配置文件`);
  }, [data]);

  const importConfig = useCallback<StoreValue["importConfig"]>((incoming, mode) => {
    setData((d) => {
      if (mode === "replace") {
        try {
          localStorage.setItem(`${STORAGE_KEY}:backup`, JSON.stringify(d));
        } catch {
          /* ignore */
        }
        return incoming;
      }
      const ids = new Set(d.apps.map((a) => a.id));
      return {
        version: DATA_VERSION,
        groups: [...d.groups, ...incoming.groups.filter((g) => !d.groups.some((x) => x.id === g.id))],
        apps: [...incoming.apps.filter((a) => !ids.has(a.id)), ...d.apps],
        favorites: Array.from(new Set([...incoming.favorites, ...d.favorites])),
        recent: [...incoming.recent, ...d.recent].slice(0, 20),
        stats: { ...incoming.stats, ...d.stats },
      };
    });
    setIsFresh(false);
    toast.success(`已导入 ${incoming.apps.length} 个应用、${incoming.groups.length} 个分组`);
  }, []);

  /* ---------- Infinity 设置 ---------- */
  const updateInfinitySettings = useCallback<StoreValue["updateInfinitySettings"]>((settings) => {
    setData((d) => ({
      ...d,
      infinitySettings: { ...d.infinitySettings, ...settings } as any,
    }));
    toast.success("Infinity 设置已保存");
  }, []);

  /* ---------- 组装 value ---------- */
  const value = useMemo<StoreValue>(() => {
    const groupById = (id: string) => data.groups.find((g) => g.id === id);
    return {
      data,
      apps: data.apps,
      orgGroups: data.groups,
      stats,
      isFresh,
      theme,
      toggleTheme,
      upsertApp,
      addApp,
      updateApp,
      removeApp,
      toggleFavorite,
      reorderFavorites,
      launch,
      copyText,
      addSection,
      renameSection,
      removeSection,
      resetToSeed,
      exportConfig,
      importConfig,
      updateInfinitySettings,
      groupById,
      sectionName: (groupId, sectionId) => {
        if (!sectionId) return groupById(groupId)?.name ?? "未分组";
        return groupById(groupId)?.sections.find((s) => s.id === sectionId)?.name ?? "未分组";
      },
    };
  }, [data, stats, isFresh, theme, toggleTheme, upsertApp, addApp, updateApp, removeApp, toggleFavorite, reorderFavorites, launch, copyText, addSection, renameSection, removeSection, resetToSeed, exportConfig, importConfig, updateInfinitySettings]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore 必须在 StoreProvider 内使用");
  return ctx;
}

/* ===================== 派生工具函数 ===================== */

export function parseUrl(url: string): { host: string; port: string; path: string; internal: boolean } {
  const info = { host: "", port: "", path: "", internal: false };
  if (!url) return info;
  try {
    const u = new URL(normalizeUrl(url));
    info.host = u.hostname;
    info.port = u.port;
    info.path = u.pathname === "/" ? "" : u.pathname;
    info.internal = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|localhost)/i.test(u.hostname);
    return info;
  } catch {
    return info;
  }
}

/** 补协议、去空格；已是 mailto 等则原样返回 */
export function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) return v;
  return `http://${v}`;
}

export function isValidUrl(input: string): boolean {
  try {
    const u = new URL(normalizeUrl(input));
    return Boolean(u.hostname) && /^[a-z]+:.+/.test(u.href);
  } catch {
    return false;
  }
}

export function relativeTime(ts?: number): string {
  if (!ts) return "从未访问";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}
