import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/layout-context";
import { groupColorOf, toneOf } from "@/lib/group-tone";
import { AppGrid } from "@/components/AppCard";
import { EmptyState, SectionLabel, StatInline } from "@/components/Bits";
import { btn } from "@/components/ui/button-variants";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/_layout/")({
  component: WorkspaceHome,
});

/** 首页工作台：内联数字概览 → 全员高频 → 常用置顶 → 最近使用 → 按部门分节 */
export function WorkspaceHome() {
  const { apps, orgGroups, stats, reorderFavorites } = useStore();
  const { openNew } = useWorkspace();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("ebara-hint") === "1");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const depts = orgGroups.filter((g) => g.kind === "dept");
  const sections = depts.reduce((n, g) => n + g.sections.length, 0);

  const today = new Date().toISOString().slice(0, 10);
  const todayHits = Object.values(stats.days).reduce((s, d) => s + (d[today] ?? 0), 0);

  const favorites = apps.filter((a) => a.favorite);
  const hotApps = orgGroups.find((g) => g.id === "g-platform");
  const platformApps = apps.filter((a) => a.groupId === hotApps?.id && !a.favorite);

  const recentIds = Object.keys(stats.recent)
    .sort((a, b) => stats.recent[b].at - stats.recent[a].at)
    .slice(0, 6)
    .map((id) => apps.find((a) => a.id === id))
    .filter(Boolean) as typeof apps;

  return (
    <div className="space-y-10">
      {/* 引导条 */}
      {!dismissed && (
        <div className="rise-in flex items-start gap-3 rounded-md border border-hairline bg-surface px-4 py-3">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <p className="flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
            点击卡片直接打开系统；悬停卡片可编辑或置顶。各部门请把示例里的 IP + 端口改成自己服务器的真实地址。
          </p>
          <button
            onClick={() => { localStorage.setItem("ebara-hint", "1"); setDismissed(true); }}
            className={btn({ variant: "ghost", size: "iconSm", className: "-mr-1 shrink-0" })}
            aria-label="关闭提示"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 内联数字概览 */}
      <section className="rise-in border-b border-hairline pb-6" style={{ animationDelay: "40ms" }}>
        <StatInline
          items={[
            { label: "接入应用", value: apps.length, unit: "个", note: `${depts.length} 部 / ${sections} 科室` },
            { label: "今日访问", value: todayHits, unit: "次", note: "仅统计本机点击" },
            { label: "常用置顶", value: favorites.length, unit: "个", note: favorites[0]?.name ?? "尚未设置" },
          ]}
        />
      </section>

      {/* 全员高频 */}
      {platformApps.length > 0 && (
        <section className="rise-in space-y-4" style={{ animationDelay: "80ms" }}>
          <SectionLabel title="公司平台" hint="全员高频入口" count={platformApps.length} />
          <AppGrid apps={platformApps} cols="2 sm:grid-cols-3" />
        </section>
      )}

      {/* 常用置顶（可拖拽） */}
      <section className="rise-in space-y-4" style={{ animationDelay: "120ms" }}>
        <SectionLabel
          title="常用置顶"
          hint={favorites.length > 1 ? "拖动卡片可调整顺序" : undefined}
          count={favorites.length || undefined}
          action={
            <Link to="/favorites" className={btn({ variant: "link", size: "sm" })}>管理</Link>
          }
        />
        {favorites.length ? (
          <AppGrid
            apps={favorites}
            cols="2 sm:grid-cols-3 xl:grid-cols-4"
            reorderable
            onReorder={(from, to) => reorderFavorites(from, to)}
          />
        ) : (
          <EmptyState
            title="还没有置顶的应用"
            desc="把每天要用的系统标上星标，它们会固定出现在这里。"
            action={<button onClick={() => openNew()} className={btn({ variant: "outline", size: "sm" })}><Plus size={13} />新增应用</button>}
          />
        )}
      </section>

      {/* 最近使用 */}
      {recentIds.length > 0 && (
        <section className="rise-in space-y-4" style={{ animationDelay: "160ms" }}>
          <SectionLabel title="最近使用" count={recentIds.length} />
          <AppGrid apps={recentIds} dense cols="2 sm:grid-cols-3 xl:grid-cols-6" placeOf={(a) => relTime(stats.recent[a.id]?.at)} />
        </section>
      )}

      {/* 按部门分节 */}
      <section className="space-y-8">
        <SectionLabel title="按部门浏览" hint={`${depts.length} 个部门`} />
        {depts.map((g, gi) => {
          const list = apps.filter((a) => a.groupId === g.id);
          const isCollapsed = collapsed[g.id];
          const tone = toneOf(groupColorOf(g.id, gi));
          return (
            <div key={g.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
                <h3 className={cn("text-[13.5px] font-medium tracking-tight", tone.text)}>{g.name}</h3>
                <span className="num text-[11.5px] text-subtle">{list.length}</span>
                <span className="hidden h-px flex-1 bg-hairline sm:block" />
                <div className="flex items-center gap-1">
                  {g.sections.map((s) => (
                    <Link
                      key={s.id}
                      to="/dept/$deptId/$sectionId"
                      params={{ deptId: g.id, sectionId: s.id }}
                      className="rounded px-1.5 py-0.5 text-[12px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                    >
                      {s.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => setCollapsed((c) => ({ ...c, [g.id]: !c[g.id] }))}
                    className={cn(btn({ variant: "ghost", size: "sm", className: "!px-1.5 text-[11.5px]" }), "ml-1")}
                  >
                    {isCollapsed ? "展开" : "折叠"}
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                list.length ? (
                  <AppGrid apps={list} cols="2 sm:grid-cols-3 xl:grid-cols-4" />
                ) : (
                  <EmptyState
                    title={`${g.name}下暂无应用`}
                    action={
                      <button onClick={() => openNew({ presetGroup: g.id, presetSection: g.sections[0]?.id })} className={btn({ variant: "outline", size: "sm" })}>
                        <Plus size={13} />在此部门新增
                      </button>
                    }
                  />
                )
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function relTime(ts?: number) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}
