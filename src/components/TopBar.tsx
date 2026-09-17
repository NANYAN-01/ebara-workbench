import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/layout-context";
import { btn } from "@/components/ui/button-variants";
import {
  ChevronDown,
  Download,
  FolderTree,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";

const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  return (
    <span className="hidden text-right leading-tight lg:block">
      <span className="num block text-[13px] font-medium text-foreground">
        {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
      </span>
      <span className="block text-[11px] text-subtle">
        {date} {WEEK[now.getDay()]}
      </span>
    </span>
  );
}

/** 组织导航抽屉：侧栏收起后由顶栏唤出 */
function OrgDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { orgGroups, apps } = useStore();
  const { openNew } = useWorkspace();
  const loc = useLocation();

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="关闭导航"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/20 fade-in"
      />
      <aside className="drawer-in absolute inset-y-0 left-0 flex w-[290px] max-w-[86vw] flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <span className="eyebrow">组织架构</span>
          <button onClick={onClose} className={btn({ variant: "ghost", size: "iconSm" })}>
            <X size={15} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {orgGroups.map((g) => (
            <div key={g.id} className="mb-1">
              <Link
                to={g.kind === "dept" ? "/dept/$deptId" : "/group/$groupId"}
                params={{ deptId: g.id, groupId: g.id } as never}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                  loc.pathname.startsWith(`/${g.kind === "dept" ? "dept" : "group"}/${g.id}`)
                    ? "bg-surface font-medium text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                <ChevronDown size={12} className="rotate-[-90deg] opacity-50" />
                <span className="truncate-1 flex-1">{g.name}</span>
                <span className="num text-[11px] text-subtle">
                  {apps.filter((a) => a.groupId === g.id).length}
                </span>
              </Link>
              {g.sections.length > 0 && (
                <div className="ml-[18px] border-l border-hairline pl-2">
                  {g.sections.map((s) => (
                    <Link
                      key={s.id}
                      to="/dept/$deptId/$sectionId"
                      params={{ deptId: g.id, sectionId: s.id }}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors",
                        loc.pathname.endsWith(`/${s.id}`)
                          ? "font-medium text-accent"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="truncate-1">{s.name}</span>
                      <span className="num text-[11px] text-subtle">
                        {apps.filter((a) => a.sectionId === s.id).length}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-hairline p-3">
          <button onClick={() => { onClose(); openNew(); }} className={btn({ variant: "outline", size: "sm", className: "w-full" })}>
            <Plus size={13} /> 新增应用
          </button>
        </div>
      </aside>
    </div>
  );
}

export function TopBar() {
  const { theme, toggleTheme, resetToSeed, exportConfig } = useStore();
  const { setSearchOpen, setImportOpen, openNew } = useWorkspace();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/78">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setDrawer(true)}
            className={btn({ variant: "ghost", size: "iconSm", className: "lg:hidden" })}
            aria-label="打开组织导航"
          >
            <FolderTree size={16} />
          </button>

          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border text-[11px] font-semibold tracking-tight text-primary">
              Eb
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate-1 text-[14px] font-medium tracking-tight text-foreground">
                研发中心工作台
              </span>
              <span className="eyebrow hidden text-[9px] sm:block">EBARA R&amp;D CENTER</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                btn({ variant: "outline", className: "hidden !w-[240px] justify-start !font-normal text-subtle sm:inline-flex" }),
              )}
            >
              <Search size={13} />
              <span className="flex-1 text-left text-[12.5px]">搜索应用、地址、科室…</span>
              <kbd className="num rounded border border-hairline px-1 py-px text-[10px] text-subtle">⌘K</kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className={btn({ variant: "ghost", size: "iconSm", className: "sm:hidden" })}
              aria-label="搜索"
            >
              <Search size={16} />
            </button>

            <Clock />

            <div className="hidden items-center gap-1 md:flex">
              <button onClick={toggleTheme} className={btn({ variant: "ghost", size: "iconSm" })} aria-label="切换主题">
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setMenu((v) => !v)} className={btn({ variant: "ghost", size: "iconSm" })} aria-label="更多操作">
                  <Settings2 size={15} />
                </button>
                {menu && (
                  <div className="panel-in absolute right-0 top-9 z-50 w-52 rounded-md border border-border bg-popover p-1 shadow-lg shadow-foreground/5">
                    {[
                      { icon: Plus, label: "新增应用", run: () => openNew() },
                      { icon: Upload, label: "导入配置", run: () => setImportOpen(true) },
                      { icon: Download, label: "导出配置", run: () => exportConfig() },
                      { icon: RotateCcw, label: "恢复默认清单", run: () => resetToSeed() },
                    ].map((it) => (
                      <button
                        key={it.label}
                        onClick={() => { it.run(); setMenu(false); }}
                        className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-[13px] text-secondary-foreground transition-colors hover:bg-surface"
                      >
                        <it.icon size={13} className="text-subtle" />
                        {it.label}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-hairline" />
                    <button
                      onClick={() => { navigate({ to: "/tools" }); setMenu(false); }}
                      className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-[13px] text-secondary-foreground transition-colors hover:bg-surface"
                    >
                      <Search size={13} className="text-subtle" /> 效率工具
                    </button>
                    <button
                      onClick={() => { navigate({ to: "/stats" }); setMenu(false); }}
                      className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-[13px] text-secondary-foreground transition-colors hover:bg-surface"
                    >
                      <FolderTree size={13} className="text-subtle" /> 使用统计
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => openNew()} className={btn({ variant: "primary", size: "sm" })}>
              <Plus size={14} />
              <span className="hidden sm:inline">新增应用</span>
            </button>
          </div>
        </div>
      </header>

      <OrgDrawer open={drawer} onClose={() => setDrawer(false)} />
    </>
  );
}
