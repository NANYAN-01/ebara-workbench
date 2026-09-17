import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/layout-context";
import { AppGrid, AppTable } from "@/components/AppCard";
import { EmptyState, PageHeader } from "@/components/Bits";
import { btn, field } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { LayoutGrid, Table2, Plus, Search } from "lucide-react";
import type { WorkApp } from "@/lib/types";

export const Route = createFileRoute("/_layout/apps")({ component: AppsPage });

const TYPES: { v: WorkApp["type"] | "all"; label: string }[] = [
  { v: "all", label: "全部类型" },
  { v: "internal", label: "内部服务" },
  { v: "platform", label: "公司平台" },
  { v: "external", label: "外部网站" },
];

/** 应用总览：部门 + 科室 + 类型三重筛选，网格/表格双视图 */
function AppsPage() {
  const { apps, orgGroups } = useStore();
  const { openNew } = useWorkspace();
  const [groupId, setGroupId] = useState("all");
  const [sectionId, setSectionId] = useState("all");
  const [type, setType] = useState<WorkApp["type"] | "all">("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");

  const group = orgGroups.find((g) => g.id === groupId);

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return apps.filter((a) => {
      if (groupId !== "all" && a.groupId !== groupId) return false;
      if (sectionId !== "all" && a.sectionId !== sectionId) return false;
      if (type !== "all" && a.type !== type) return false;
      if (words.length) {
        const hay = `${a.name} ${a.url} ${a.desc ?? ""} ${(a.tags ?? []).join(" ")}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [apps, groupId, sectionId, type, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="全量清单"
        title="应用总览"
        desc="按部门、科室与类型筛选；表格视图适合核对地址，网格视图适合日常跳转。"
        action={
          <button onClick={() => openNew()} className={btn({ variant: "primary", size: "sm" })}>
            <Plus size={14} />新增应用
          </button>
        }
      />

      {/* 筛选条 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-[280px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="按名称或地址过滤…"
            className={cn(field, "!pl-9 h-9")}
          />
        </div>

        <select value={groupId} onChange={(e) => { setGroupId(e.target.value); setSectionId("all"); }} className={cn(field, "h-9 w-auto min-w-[120px]")}>
          <option value="all">全部部门</option>
          {orgGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>

        {group?.kind === "dept" && group.sections.length > 0 && (
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={cn(field, "h-9 w-auto min-w-[120px]")}>
            <option value="all">全部科室</option>
            {group.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        <div className="flex gap-1 rounded-md border border-hairline bg-surface p-1">
          {TYPES.map((t) => (
            <button
              key={t.v}
              onClick={() => setType(t.v)}
              className={cn(
                "rounded px-2.5 py-1 text-[12px] transition-colors",
                type === t.v ? "bg-card font-medium text-foreground shadow-sm shadow-foreground/5" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="num text-[12px] text-subtle">{list.length} / {apps.length}</span>
          <div className="flex gap-0.5 rounded-md border border-hairline p-0.5">
            <button onClick={() => setView("grid")} className={cn(btn({ variant: "ghost", size: "iconSm" }), view === "grid" && "bg-surface text-foreground")} aria-label="网格视图"><LayoutGrid size={13} /></button>
            <button onClick={() => setView("table")} className={cn(btn({ variant: "ghost", size: "iconSm" }), view === "table" && "bg-surface text-foreground")} aria-label="表格视图"><Table2 size={13} /></button>
          </div>
        </div>
      </div>

      {list.length ? (
        view === "grid" ? <AppGrid apps={list} cols="2 sm:grid-cols-3 xl:grid-cols-4" /> : <AppTable apps={list} />
      ) : (
        <EmptyState
          title="没有符合条件的应用"
          desc="试着放宽筛选条件，或直接新建一个应用登记进来。"
          action={
            <div className="flex gap-2">
              <button onClick={() => { setQ(""); setGroupId("all"); setSectionId("all"); setType("all"); }} className={btn({ variant: "outline", size: "sm" })}>清除筛选</button>
              <button onClick={() => openNew({ presetName: q.trim() || undefined, presetGroup: groupId !== "all" ? groupId : undefined, presetSection: sectionId !== "all" ? sectionId : undefined })} className={btn({ variant: "primary", size: "sm" })}>
                <Plus size={13} />新建应用
              </button>
            </div>
          }
        />
      )}
    </div>
  );
}
