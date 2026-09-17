import { useState } from "react";
import type { DragEvent } from "react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/layout-context";
import { useStore } from "@/lib/store";
import { AppGlyph } from "@/components/AppGlyph";
import { Chip, StatusDot } from "@/components/Bits";
import { btn } from "@/components/ui/button-variants";
import { Copy, ExternalLink, Pencil, Star } from "lucide-react";
import type { WorkApp } from "@/lib/types";

/** 悬停才浮现的操作按钮（触屏设备常驻，见 styles.css .hover-reveal） */
function CardActions({ app }: { app: WorkApp }) {
  const { openEdit } = useWorkspace();
  const { toggleFavorite, copyText, launch } = useStore();

  return (
    <div className="hover-reveal pointer-events-none absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
      <button
        aria-label={app.favorite ? "取消置顶" : "设为常用"}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(app.id); }}
        className={cn(btn({ variant: "ghost", size: "iconSm" }), "h-6 w-6")}
      >
        <Star size={13} className={app.favorite ? "fill-accent text-accent" : ""} />
      </button>
      <button
        aria-label="编辑"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(app); }}
        className={cn(btn({ variant: "ghost", size: "iconSm" }), "h-6 w-6")}
      >
        <Pencil size={12} />
      </button>
      <button
        aria-label="复制地址"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyText(app.url); }}
        className={cn(btn({ variant: "ghost", size: "iconSm" }), "h-6 w-6")}
      >
        <Copy size={12} />
      </button>
      <button
        aria-label="新标签页打开"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); launch(app.id); }}
        className={cn(btn({ variant: "ghost", size: "iconSm" }), "h-6 w-6")}
      >
        <ExternalLink size={12} />
      </button>
    </div>
  );
}

// store 与布局动作在文件顶部一次性导入，组件内直接取用

export function AppCard({
  app,
  dense = false,
  draggable = false,
  onDragStart,
  onDropAt,
  placeOf,
}: {
  app: WorkApp;
  dense?: boolean;
  draggable?: boolean;
  onDragStart?: (id: string, e: DragEvent) => void;
  onDropAt?: (targetId: string, e: DragEvent) => void;
  placeOf?: (app: WorkApp) => string;
}) {
  const [over, setOver] = useState(false);
  const { launch } = useStore();
  const { orgGroups } = useStore();
  const group = orgGroups.find((g) => g.id === app.groupId);
  const section = group?.sections.find((s) => s.id === app.sectionId);

  return (
    <a
      href={app.url}
      target="_blank"
      rel="noreferrer"
      title={app.name}
      draggable={draggable}
      onDragStart={(e) => { if (!draggable) return; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", app.id); onDragStart?.(app.id, e); }}
      onDragOver={(e) => { if (!onDropAt) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { if (!onDropAt) return; e.preventDefault(); setOver(false); onDropAt(app.id, e); }}
      onClick={(e) => { e.preventDefault(); launch(app.id); }}
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-md border bg-card text-left transition-[border-color,background-color] duration-150",
        "hover:border-border hover:bg-surface",
        over && "border-accent ring-1 ring-accent/25",
        dense ? "gap-2 p-3" : "gap-2.5 p-4",
      )}
    >
      <div className="flex items-start gap-2.5 pr-16">
        <AppGlyph name={app.name} url={app.url} appId={app.id} color={app.glyph} size={dense ? "sm" : "md"} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate-1 text-[13.5px] font-bold leading-snug tracking-tight text-foreground">{app.name}</p>
          <p className="num mt-0.5 truncate-1 text-[11px] leading-snug text-subtle">{app.url.replace(/^https?:\/\//, "")}</p>
        </div>
      </div>

      {!dense && app.desc && (
        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{app.desc}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-0.5">
        <StatusDot status={app.status} />
        {app.intranet && <Chip tone="outline">内网</Chip>}
        {section && <span className="truncate-1 text-[11.5px] text-subtle">{section.name}</span>}
        {placeOf && <span className="ml-auto shrink-0 text-[11.5px] text-subtle">{placeOf(app)}</span>}
      </div>

      <CardActions app={app} />
    </a>
  );
}

/** 卡片墙：原生 HTML5 拖放四件套齐全，支持跨容器移动与同容器排序 */
export function AppGrid({
  apps,
  dense,
  reorderable,
  onReorder,
  placeOf,
  cols = "2 sm:grid-cols-3 xl:grid-cols-4",
}: {
  apps: WorkApp[];
  dense?: boolean;
  reorderable?: boolean;
  onReorder?: (fromId: string, toId: string) => void;
  placeOf?: (app: WorkApp) => string;
  cols?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <div className={cn("grid grid-cols-1 gap-3", cols)}>
      {apps.map((a) => (
        <AppCard
          key={a.id}
          app={a}
          dense={dense}
          draggable={reorderable}
          placeOf={placeOf}
          onDragStart={(id) => setDragId(id)}
          onDropAt={
            reorderable && onReorder
              ? (targetId) => {
                  if (dragId && dragId !== targetId) onReorder(dragId, targetId);
                  setDragId(null);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

/** 紧凑表格视图（应用总览用） */
export function AppTable({ apps }: { apps: WorkApp[] }) {
  const ws = useWorkspace();
  const st = useStore();
  const { launch, toggleFavorite, orgGroups } = st;
  const { openEdit } = ws;
  const owner = (a: WorkApp) => {
    const g = orgGroups.find((x) => x.id === a.groupId);
    const s = g?.sections.find((x) => x.id === a.sectionId);
    return s ? `${g?.name} / ${s.name}` : (g?.name ?? "—");
  };

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline bg-surface">
            {["名称", "归属", "访问地址", "类型", "状态", ""].map((h) => (
              <th key={h} className="eyebrow px-4 py-2.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id} className="group border-b border-hairline transition-colors last:border-0 hover:bg-surface">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <AppGlyph name={a.name} url={a.url} appId={a.id} color={a.glyph} size="sm" />
                  <span className="truncate-1 text-[13px] font-bold text-foreground">{a.name}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-muted-foreground">{owner(a)}</td>
              <td className="num max-w-[280px] truncate px-4 py-2.5 text-[12px] text-subtle">{a.url}</td>
              <td className="whitespace-nowrap px-4 py-2.5"><Chip>{TYPE_LABEL[a.type]}</Chip></td>
              <td className="whitespace-nowrap px-4 py-2.5"><StatusDot status={a.status} /></td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">
                <div className="inline-flex items-center gap-0.5">
                  <button onClick={() => toggleFavorite(a.id)} className={btn({ variant: "ghost", size: "iconSm" })} aria-label="置顶">
                    <Star size={13} className={a.favorite ? "fill-accent text-accent" : ""} />
                  </button>
                  <button onClick={() => openEdit(a)} className={btn({ variant: "ghost", size: "iconSm" })} aria-label="编辑">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => launch(a.id)} className={btn({ variant: "ghost", size: "iconSm" })} aria-label="打开">
                    <ExternalLink size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TYPE_LABEL: Record<WorkApp["type"], string> = {
  internal: "内部服务",
  platform: "公司平台",
  external: "外部网站",
};
