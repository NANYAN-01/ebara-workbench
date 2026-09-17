import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { groupColorOf, toneOf } from "@/lib/group-tone";
import { BarChart3, LayoutGrid, Star, Wrench } from "lucide-react";

/**
 * 顶部横向分组标签：替代原来的常驻侧栏。
 * 窄屏可横向滑动且不换行，右侧渐隐提示还有更多。
 */
export function GroupTabs() {
  const { orgGroups, apps } = useStore();
  const loc = useLocation();

  const deptTabs = orgGroups
    .filter((g) => g.kind === "dept")
    .map((g, i) => ({ id: g.id, name: g.name, href: `/dept/${g.id}`, count: apps.filter((a) => a.groupId === g.id).length, tone: toneOf(groupColorOf(g.id, i)) }));

  const groupTabs = orgGroups
    .filter((g) => g.kind === "group")
    .map((g, i) => ({ id: g.id, name: g.name, href: `/group/${g.id}`, count: apps.filter((a) => a.groupId === g.id).length, tone: toneOf(groupColorOf(g.id, i + 3)) }));

  const tabs = [
    { id: "__all", name: "全部应用", href: "/", count: apps.length, tone: undefined },
    ...deptTabs,
    ...groupTabs,
    { id: "__fav", name: "常用置顶", href: "/favorites", count: apps.filter((a) => a.favorite).length, tone: undefined },
    { id: "__tools", name: "效率工具", href: "/tools", count: undefined, tone: undefined },
    { id: "__stats", name: "使用统计", href: "/stats", count: undefined, tone: undefined },
  ];

  const isActive = (href: string) =>
    href === "/" ? loc.pathname === "/" : loc.pathname === href || loc.pathname.startsWith(`${href}/`);

  return (
    <div className="sticky top-14 z-30 border-b border-border bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/78">
      <div className="fade-x-right overflow-x-auto px-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-0.5 py-1.5">
          {tabs.map((t) => {
            const active = isActive(t.href);
            const Icon = t.href === "/favorites" ? Star : t.href === "/tools" ? Wrench : t.href === "/stats" ? BarChart3 : t.href === "/" ? LayoutGrid : null;
            return (
              <Link
                key={t.id}
                to={t.href}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150",
                  active ? cn("font-medium", t.tone?.text ?? "text-foreground") : "text-muted-foreground hover:text-foreground",
                )}
              >
                {Icon && <Icon size={12} className={active ? t.tone?.text ?? "text-accent" : "opacity-55"} />}
                {t.name}
                {typeof t.count === "number" && (
                  <span className={cn("num text-[11px]", active ? t.tone?.text ?? "text-accent" : "text-subtle")}>{t.count}</span>
                )}
                {active && (
                  <span
                    className={cn(
                      "absolute inset-x-3 -bottom-[7px] h-[2px] rounded-full",
                      t.tone?.bg ?? "bg-accent",
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
