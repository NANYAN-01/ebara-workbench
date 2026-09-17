import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { AppGrid } from "@/components/AppCard";
import { EmptyState, PageHeader } from "@/components/Bits";
import { btn } from "@/components/ui/button-variants";
import { History } from "lucide-react";

export const Route = createFileRoute("/_layout/recent")({ component: RecentPage });

/** 最近使用页：按最后一次点击时间倒序 */
function RecentPage() {
  const { apps, stats } = useStore();
  const [limit, setLimit] = useState(20);

  const items = Object.keys(stats.recent)
    .sort((a, b) => stats.recent[b].at - stats.recent[a].at)
    .map((id) => ({ app: apps.find((a) => a.id === id), at: stats.recent[id].at }))
    .filter((x): x is { app: NonNullable<typeof x.app>; at: number } => Boolean(x.app))
    .slice(0, limit);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="个人视图"
        title="最近使用"
        desc="记录你在本机浏览器里最近打开过的应用，最多保留 20 条。"
        action={
          items.length > 0 ? (
            <Link to="/" className={btn({ variant: "outline", size: "sm" })}>返回首页</Link>
          ) : undefined
        }
      />

      {items.length ? (
        <>
          <AppGrid
            apps={items.map((i) => i.app)}
            cols="2 sm:grid-cols-3 xl:grid-cols-4"
            placeOf={(a) => relTime(items.find((i) => i.app?.id === a.id)?.at ?? 0)}
          />
          {limit < 20 && (
            <button onClick={() => setLimit(20)} className={btn({ variant: "ghost", size: "sm" })}>
              <History size={13} /> 显示更多
            </button>
          )}
        </>
      ) : (
        <EmptyState
          title="还没有访问记录"
          desc="点击上方任意应用卡片打开系统后，这里就会出现记录。"
          action={<Link to="/" className={btn({ variant: "outline", size: "sm" })}>去浏览应用</Link>}
        />
      )}
    </div>
  );
}

function relTime(ts: number) {
  if (!ts) return "";
  const m = Math.floor((Date.now() - ts) / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}
