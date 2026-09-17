import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/layout-context";
import { AppGlyph } from "@/components/AppGlyph";
import { btn } from "@/components/ui/button-variants";
import { ExternalLink, FolderOpen, Star } from "lucide-react";
import type { WorkApp, OrgGroup, InfinitySettings } from "@/lib/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** 内置壁纸列表 */
const BUILTIN_WALLPAPERS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80",
];

/** 图标大小映射 */
const ICON_SIZES: Record<InfinitySettings["iconSize"], { container: string; glyph: "sm" | "md" | "lg"; label: string }> = {
  sm: { container: "h-12 w-12", glyph: "sm", label: "小" },
  md: { container: "h-16 w-16", glyph: "md", label: "中" },
  lg: { container: "h-20 w-20", glyph: "lg", label: "大" },
};

/** 单个可拖拽的图标 */
function InfinityIcon({
  app,
  size,
  radius,
  onLaunch,
  onToggleFavorite,
}: {
  app: WorkApp;
  size: InfinitySettings["iconSize"];
  radius: number;
  onLaunch: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const sizeConfig = ICON_SIZES[size];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="infinity-icon group flex flex-col items-center gap-1.5"
    >
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-200",
          sizeConfig.container,
          "bg-card/80 backdrop-blur-sm border border-white/20 shadow-lg",
          "hover:scale-110 hover:shadow-xl hover:border-white/40",
          "cursor-pointer",
        )}
        style={{ borderRadius: `${radius}%` }}
        onClick={() => onLaunch(app.id)}
      >
        <AppGlyph name={app.name} url={app.url} appId={app.id} color={app.glyph} size={sizeConfig.glyph} />

        {/* 收藏星标 */}
        <button
          className={cn(
            "absolute -right-1 -top-1 rounded-full p-0.5 opacity-0 transition-opacity",
            "group-hover:opacity-100",
            app.favorite ? "text-yellow-400" : "text-white/60 hover:text-yellow-400",
          )}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(app.id); }}
        >
          <Star size={12} className={app.favorite ? "fill-current" : ""} />
        </button>

        {/* 状态指示器 */}
        {app.status === "maintenance" && (
          <div className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-yellow-400" />
        )}
        {app.status === "offline" && (
          <div className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-red-400" />
        )}
      </div>

      <span className="max-w-[80px] truncate text-center text-[11px] leading-tight text-white drop-shadow-md">
        {app.name}
      </span>
    </div>
  );
}

/** 文件夹图标 */
function FolderIcon({
  group,
  apps,
  size,
  radius,
  onLaunch,
  onToggleFavorite,
}: {
  group: OrgGroup;
  apps: WorkApp[];
  size: InfinitySettings["iconSize"];
  radius: number;
  onLaunch: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const sizeConfig = ICON_SIZES[size];

  return (
    <>
      <div
        className={cn(
          "infinity-icon group flex flex-col items-center gap-1.5",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center transition-all duration-200 cursor-pointer",
            sizeConfig.container,
            "bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg",
            "hover:scale-110 hover:shadow-xl hover:border-white/40",
          )}
          style={{ borderRadius: `${radius}%` }}
          onClick={() => setOpen(true)}
        >
          <FolderOpen size={24} className="text-white/80" />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-white/20 px-1 text-[9px] text-white">
            {apps.length}
          </span>
        </div>

        <span className="max-w-[80px] truncate text-center text-[11px] leading-tight text-white drop-shadow-md">
          {group.name}
        </span>
      </div>

      {/* 文件夹展开弹窗 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/20 bg-card/95 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{group.name}</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-surface"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {apps.map((app) => (
                <InfinityIcon
                  key={app.id}
                  app={app}
                  size="sm"
                  radius={radius}
                  onLaunch={(id) => { onLaunch(id); setOpen(false); }}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Infinity 风格图标网格主页 */
export function InfinityGrid() {
  const { apps, data, orgGroups, stats, toggleFavorite } = useStore();
  const { launch } = useStore();
  const { openNew } = useWorkspace();

  const settings = data.infinitySettings ?? {
    iconSize: "md" as const,
    iconRadius: 20,
    columns: 6,
    wallpaperType: "builtin" as const,
    wallpaperIndex: 0,
    wallpaperUrl: "",
    wallpaperBlur: 0,
    wallpaperOverlay: 30,
    showSearch: true,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // 获取收藏的应用（按顺序）
  const appMap = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const favoriteApps = data.favorites.map((id) => appMap.get(id)).filter(Boolean) as WorkApp[];

  // 获取公共分组（用于文件夹）
  const publicGroups = orgGroups.filter((g) => g.kind === "group");
  const deptGroups = orgGroups.filter((g) => g.kind === "dept");

  // 壁纸 URL
  const wallpaperUrl = settings.wallpaperType === "custom" && settings.wallpaperUrl
    ? settings.wallpaperUrl
    : settings.wallpaperType === "builtin"
      ? BUILTIN_WALLPAPERS[settings.wallpaperIndex % BUILTIN_WALLPAPERS.length]
      : "";

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // 这里可以添加拖拽排序逻辑
  }

  const gridCols: Record<number, string> = {
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
  };

  return (
    <div
      className="infinity-container relative min-h-screen overflow-hidden"
      style={{
        background: wallpaperUrl ? `url(${wallpaperUrl}) center/cover no-repeat` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* 壁纸遮罩 */}
      {wallpaperUrl && settings.wallpaperOverlay > 0 && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: settings.wallpaperOverlay / 100 }}
        />
      )}
      {wallpaperUrl && settings.wallpaperBlur > 0 && (
        <div
          className="absolute inset-0"
          style={{ backdropFilter: `blur(${settings.wallpaperBlur}px)` }}
        />
      )}

      {/* 主内容区 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-12">
        {/* 搜索框 */}
        {settings.showSearch && (
          <div className="mb-8 w-full max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索应用..."
                className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder-white/50 backdrop-blur-sm focus:border-white/40 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const query = (e.target as HTMLInputElement).value.toLowerCase();
                    const found = apps.find((a) => a.name.toLowerCase().includes(query) || a.url.toLowerCase().includes(query));
                    if (found) launch(found.id);
                  }
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">⌘K</span>
            </div>
          </div>
        )}

        {/* 收藏图标区 */}
        {favoriteApps.length > 0 && (
          <section className="mb-8 w-full max-w-4xl">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">常用</h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={favoriteApps.map((a) => a.id)} strategy={rectSortingStrategy}>
                <div className={cn("grid gap-4", gridCols[settings.columns] ?? "grid-cols-6")}>
                  {favoriteApps.map((app) => (
                    <InfinityIcon
                      key={app.id}
                      app={app}
                      size={settings.iconSize}
                      radius={settings.iconRadius}
                      onLaunch={launch}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        )}

        {/* 文件夹区 - 公共分组 */}
        {publicGroups.length > 0 && (
          <section className="mb-8 w-full max-w-4xl">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">分组</h2>
            <div className={cn("grid gap-4", gridCols[settings.columns] ?? "grid-cols-6")}>
              {publicGroups.map((group) => {
                const groupApps = apps.filter((a) => a.groupId === group.id);
                return (
                  <FolderIcon
                    key={group.id}
                    group={group}
                    apps={groupApps}
                    size={settings.iconSize}
                    radius={settings.iconRadius}
                    onLaunch={launch}
                    onToggleFavorite={toggleFavorite}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* 部门文件夹区 */}
        {deptGroups.length > 0 && (
          <section className="mb-8 w-full max-w-4xl">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">部门</h2>
            <div className={cn("grid gap-4", gridCols[settings.columns] ?? "grid-cols-6")}>
              {deptGroups.map((group) => {
                const groupApps = apps.filter((a) => a.groupId === group.id);
                return (
                  <FolderIcon
                    key={group.id}
                    group={group}
                    apps={groupApps}
                    size={settings.iconSize}
                    radius={settings.iconRadius}
                    onLaunch={launch}
                    onToggleFavorite={toggleFavorite}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* 添加按钮 */}
        <button
          onClick={() => openNew()}
          className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
        >
          <span className="text-2xl">+</span>
        </button>
      </div>
    </div>
  );
}
