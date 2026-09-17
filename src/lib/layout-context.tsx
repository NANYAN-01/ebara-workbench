import { createContext, useContext, type ReactNode } from "react";
import type { WorkApp } from "./types";

/**
 * 布局层浮动作：把「打开搜索 / 打开表单 / 打开导入」等能力下发给子路由，
 * 避免 props 层层传递。数据操作一律走 useStore()。
 */
export interface FormPreset {
  presetGroup?: string;
  presetSection?: string;
  presetName?: string;
}

interface WorkspaceValue {
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  importOpen: boolean;
  setImportOpen: (v: boolean) => void;
  openSearch: () => void;
  openImport: () => void;
  openNew: (preset?: FormPreset) => void;
  openEdit: (app: WorkApp) => void;
  closeForm: () => void;
}

const Ctx = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ value, children }: { value: WorkspaceValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace 必须在 WorkspaceProvider 内使用");
  return ctx;
}

export { useStore } from "./store";
