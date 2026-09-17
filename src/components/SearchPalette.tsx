import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/layout-context";
import { AppGlyph } from "@/components/AppGlyph";
import { Chip } from "@/components/Bits";
import { Plus, Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import type { WorkApp } from "@/lib/types";

/** 多关键词「与」匹配：名称/地址/备注/标签/部门科室名 */
function matchScore(app: WorkApp, words: string[], label: (a: WorkApp) => string): number {
  const hay = `${app.name} ${app.url} ${app.desc ?? ""} ${(app.tags ?? []).join(" ")} ${label(app)}`.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (!hay.includes(w)) return -1;
    score += app.name.toLowerCase().includes(w) ? 3 : 1;
  }
  return score;
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { apps, orgGroups, launch, stats } = useStore();
  const { openNew } = useWorkspace();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const label = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of orgGroups) {
      map.set(g.id, g.name);
      for (const s of g.sections) map.set(s.id, `${g.name} / ${s.name}`);
    }
    return (a: WorkApp) => map.get(a.sectionId) ?? map.get(a.groupId) ?? "";
  }, [orgGroups]);

  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) {
      // 空查询时给出常用与最近，避免面板一片空白
      const fav = apps.filter((a) => a.favorite).slice(0, 6);
      const recentIds = Object.keys(stats.recent).sort((a, b) => stats.recent[b].at - stats.recent[a].at);
      const recent = recentIds.map((id) => apps.find((a) => a.id === id)).filter(Boolean) as WorkApp[];
      return Array.from(new Set([...fav, ...recent])).slice(0, 8);
    }
    return apps
      .map((a) => ({ a, s: matchScore(a, words, label) }))
      .filter((x) => x.s >= 0)
      .sort((x, y) => y.s - y.s || (stats.hits[y.a.id] ?? 0) - (stats.hits[x.a.id] ?? 0))
      .slice(0, 12)
      .map((x) => x.a);
  }, [apps, q, label, stats]);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, Math.max(results.length - 1, 0))); }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && results[cursor]) { e.preventDefault(); launch(results[cursor].id); onClose(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, results, cursor, launch, onClose]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <button aria-label="关闭搜索" onClick={onClose} className="fade-in absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" />
      <div className="panel-in relative w-full max-w-[600px] overflow-hidden rounded-lg border border-border bg-popover shadow-xl shadow-foreground/10">
        <div className="flex items-center gap-2.5 border-b border-hairline px-4">
          <Search size={15} className="shrink-0 text-subtle" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索应用名称、地址、标签或科室…"
            className="h-12 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-subtle"
          />
          <kbd className="num hidden rounded border border-hairline px-1.5 py-0.5 text-[10px] text-subtle sm:block">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-[13.5px] text-muted-foreground">没有找到与「{q}」相关的应用</p>
              <button
                onClick={() => { onClose(); openNew({ presetName: q.trim() }); }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface"
              >
                <Plus size={13} className="text-accent" /> 以此名称新建应用
              </button>
            </div>
          ) : (
            <>
              {!q.trim() && <p className="eyebrow px-3 py-2">常用与最近</p>}
              {results.map((a, i) => (
                <button
                  key={a.id}
                  data-idx={i}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => { launch(a.id); onClose(); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                    i === cursor ? "bg-surface" : "hover:bg-surface/60",
                  )}
                >
                  <AppGlyph name={a.name} url={a.url} appId={a.id} color={a.glyph} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate-1 text-[13.5px] font-bold text-foreground">{a.name}</span>
                    <span className="num block truncate-1 text-[11.5px] text-subtle">{a.url.replace(/^https?:\/\//, "")}</span>
                  </span>
                  <Chip tone="outline" className="hidden shrink-0 sm:inline-flex">{label(a)}</Chip>
                  {i === cursor && (
                    <span className="hidden shrink-0 items-center gap-1 text-[11px] text-subtle sm:flex">
                      <CornerDownLeft size={11} /> 打开
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-hairline bg-surface px-4 py-2 text-[11.5px] text-subtle">
          <span className="flex items-center gap-1"><ArrowUp size={11} /><ArrowDown size={11} /> 选择</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={11} /> 新标签页打开</span>
          <button
            onClick={() => { onClose(); navigate({ to: "/apps" }); }}
            className="ml-auto transition-colors hover:text-foreground"
          >
            查看全部应用
          </button>
        </div>
      </div>
    </div>
  );
}
