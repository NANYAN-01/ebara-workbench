import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { AppGlyph } from "@/components/AppGlyph";
import { EmptyState, PageHeader, SectionLabel, StatInline } from "@/components/Bits";
import { btn } from "@/components/ui/button-variants";
import { groupColorOf, toneOf } from "@/lib/group-tone";
import { cn } from "@/lib/utils";
import type { WorkApp } from "@/lib/types";

export const Route = createFileRoute("/_layout/stats")({ component: StatsPage });

/** 使用统计页：近 7 天趋势 + 访问排行 + 分组分布（马卡龙柔彩点缀） */
function StatsPage() {
  const { apps, orgGroups, stats } = useStore();

  const totalHits = useMemo(
    () => Object.values(stats.days).reduce((s, d) => s + Object.values(d).reduce((a, b) => a + b, 0), 0),
    [stats],
  );

  // 近 7 天趋势
  const trend = useMemo(() => {
    const days: { key: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      const count = Object.values(stats.days).reduce((s, day) => s + (day[key] ?? 0), 0);
      days.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, count });
    }
    return days;
  }, [stats]);

  const maxDay = Math.max(...trend.map((t) => t.count), 1);

  // 排行
  const ranking = useMemo(() => {
    const rows = apps
      .map((a) => ({ app: a, hits: stats.hits[a.id] ?? 0, last: stats.recent[a.id]?.at }))
      .filter((r) => r.hits > 0)
      .sort((x, y) => y.hits - x.hits)
      .slice(0, 10);
    return rows;
  }, [apps, stats]);

  const maxHit = Math.max(...ranking.map((r) => r.hits), 1);

  // 分组分布
  const dist = useMemo(
    () =>
      orgGroups
        .map((g) => ({ g, n: apps.filter((a) => a.groupId === g.id).length }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n),
    [orgGroups, apps],
  );
  const maxDist = Math.max(...dist.map((d) => d.n), 1);

  const uniqApps = Object.keys(stats.hits).filter((id) => (stats.hits[id] ?? 0) > 0).length;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="本机口径"
        title="使用统计"
        desc="只统计这台浏览器上的点击跳转，不做跨人汇总。可用来判断哪些应用真的有人用、哪些已经该下线。"
        action={<Link to="/apps" className={btn({ variant: "outline", size: "sm" })}>管理清单</Link>}
      />

      <section className="border-b border-hairline pb-6">
        <StatInline
          items={[
            { label: "累计跳转", value: totalHits, unit: "次" },
            { label: "被访问过的应用", value: uniqApps, unit: "个", note: `共 ${apps.length} 个` },
            { label: "今日", value: trend[trend.length - 1]?.count ?? 0, unit: "次" },
          ]}
        />
      </section>

      {/* 趋势 */}
      <section className="space-y-4">
        <SectionLabel title="近 7 天访问" hint="按自然日聚合" />
        <div className="flex h-[150px] items-end gap-2 rounded-md border border-hairline bg-surface p-5 sm:gap-3">
          {trend.map((t) => (
            <div key={t.key} className="group flex flex-1 flex-col items-center justify-end gap-2">
              <span className="num text-[11px] text-subtle opacity-0 transition-opacity group-hover:opacity-100">{t.count}</span>
              <div
                className={cn("w-full max-w-[38px] rounded-sm transition-colors", t.count ? "bg-t-sky/45 group-hover:bg-t-sky" : "bg-transparent ring-1 ring-inset ring-border")}
                style={{ height: `${Math.max((t.count / maxDay) * 100, t.count ? 6 : 1)}%` }}
              />
              <span className="num text-[10.5px] text-subtle">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 排行 */}
      <section className="space-y-4">
        <SectionLabel title="访问次数排行" hint="Top 10" count={ranking.length || undefined} />
        {ranking.length ? (
          <ol className="divide-y divide-hairline overflow-hidden rounded-md border border-border">
            {ranking.map((r, i) => (
              <li key={r.app.id} className="flex items-center gap-3 bg-card px-4 py-3">
                <span className="num w-5 shrink-0 text-[12px] text-subtle">{i + 1}</span>
                <AppGlyph name={r.app.name} url={r.app.url} appId={r.app.id} color={r.app.glyph} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate-1 text-[13px] font-bold text-foreground">{r.app.name}</p>
                  <p className="num truncate-1 text-[11px] text-subtle">{ownerOf(r.app, orgGroups)}</p>
                </div>
                <div className="hidden h-1 w-28 shrink-0 overflow-hidden rounded-full bg-surface sm:block">
                  <div className="h-full rounded-full bg-t-grape/70" style={{ width: `${(r.hits / maxHit) * 100}%` }} />
                </div>
                <span className="num w-12 shrink-0 text-right text-[13px] font-medium text-foreground">{r.hits}</span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="还没有访问记录" desc="从首页或搜索面板点开几个应用后，这里就会出现排行。" action={<Link to="/" className={btn({ variant: "outline", size: "sm" })}>去首页</Link>} />
        )}
      </section>

      {/* 分布 */}
      <section className="space-y-4">
        <SectionLabel title="各分组应用数量" />
        <div className="grid gap-x-8 gap-y-3 rounded-md border border-hairline bg-surface p-5 sm:grid-cols-2">
          {dist.map(({ g, n }, i) => (
            <div key={g.id} className="flex items-center gap-3">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneOf(groupColorOf(g.id, i)).dot)} />
              <span className="w-24 shrink-0 truncate-1 text-[12.5px] text-secondary-foreground">{g.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card">
                <div className={cn("h-full rounded-full opacity-70", toneOf(groupColorOf(g.id, i)).bg)} style={{ width: `${(n / maxDist) * 100}%` }} />
              </div>
              <span className="num w-6 shrink-0 text-right text-[12px] text-muted-foreground">{n}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ownerOf(a: WorkApp, orgGroups: ReturnType<typeof useStore>["orgGroups"]) {
  const g = orgGroups.find((x) => x.id === a.groupId);
  const s = g?.sections.find((x) => x.id === a.sectionId);
  return s ? `${g?.name} / ${s.name}` : (g?.name ?? "未归属");
}
