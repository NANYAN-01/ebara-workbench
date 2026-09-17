import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/layout-context";
import { AppGrid } from "@/components/AppCard";
import { EmptyState, PageHeader, SectionLabel } from "@/components/Bits";
import { btn } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_layout/favorites")({ component: FavoritesPage });

/** 常用置顶页：拖拽排序 + 一键取消 */
function FavoritesPage() {
  const { apps, reorderFavorites, toggleFavorite } = useStore();
  const { openNew } = useWorkspace();
  const favs = apps.filter((a) => a.favorite);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="个人视图"
        title="常用置顶"
        desc="把每天要用的系统标上星标，它们会出现在这里和首页顶部。拖动卡片可调整顺序，顺序保存在本机浏览器。"
        action={<button onClick={() => openNew()} className={btn({ variant: "primary", size: "sm" })}><Plus size={14} />新增应用</button>}
      />

      {favs.length ? (
        <>
          <SectionLabel title="已置顶" hint="拖动卡片可调整顺序" count={favs.length} />
          <AppGrid apps={favs} cols="2 sm:grid-cols-3 xl:grid-cols-4" reorderable onReorder={(f, t) => reorderFavorites(f, t)} />
          <div className="rounded-md border border-hairline bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
            想快速取消置顶？在任意卡片上悬停，点击右上角的实心星标即可。
          </div>
        </>
      ) : (
        <EmptyState
          className={cn("items-center py-16 text-center")}
          title="还没有置顶的应用"
          desc="回到全部应用列表，点卡片右上角的星标即可置顶。"
          action={<Link to="/" className={btn({ variant: "outline", size: "sm" })}>浏览全部应用</Link>}
        />
      )}
    </div>
  );
}
