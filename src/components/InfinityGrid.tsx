import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/layout-context";
import { AppGlyph } from "@/components/AppGlyph";
import { Star } from "lucide-react";
import type { WorkApp, InfinitySettings } from "@/lib/types";
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
  sm: { container: "h-14 w-14", glyph: "sm", label: "小" },
  md: { container: "h-18 w-18", glyph: "md", label: "中" },
  lg: { container: "h-22 w-22", glyph: "lg", label: "大" },
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
      className="infinity-icon group flex flex-col items-center gap-2"
    >
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-200",
          sizeConfig.container,
          "bg-white/15 backdrop-blur-sm border border-white/25 shadow-lg",
          "hover:scale-110 hover:shadow-xl hover:border-white/50 hover:bg-white/25",
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
          <div className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-yellow-400 border border-black/20" />
        )}
        {app.status === "offline" && (
          <div className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-red-400 border border-black/20" />
        )}
      </div>

      <span className="max-w-[100px] truncate text-center text-[12px] leading-tight text-white drop-shadow-lg font-medium">
        {app.name}
      </span>
    </div>
  );
}

/** Infinity 风格图标网格主页 - 全铺展开 */
export function InfinityGrid() {
  const { apps, data, orgGroups, toggleFavorite, launch } = useStore();
  const { openNew } = useWorkspace();

  const settings = data.infinitySettings ?? {
    iconSize: "md" as const,
    iconRadius: 20,
    columns: 8,
    wallpaperType: "builtin" as const,
    wallpaperIndex: 0,
    wallpaperUrl: "",
    wallpaperBlur: 0,
    wallpaperOverlay: 20,
    showSearch: true,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // 获取收藏的应用（按顺序）
  const appMap = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const favoriteApps = data.favorites.map((id) => appMap.get(id)).filter(Boolean) as WorkApp[];

  // 按分组组织应用（全铺开，不折叠）
  const groups = useMemo(() => {
    return orgGroups
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        ...group,
        apps: apps.filter((a) => a.groupId === group.id),
      }));
  }, [orgGroups, apps]);

  // 壁纸 URL
  const wallpaperUrl = settings.wallpaperType === "custom" && settings.wallpaperUrl
    ? settings.wallpaperUrl
    : settings.wallpaperType === "builtin"
      ? BUILTIN_WALLPAPERS[settings.wallpaperIndex % BUILTIN_WALLPAPERS.length]
      : "";

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  }

  const gridCols: Record<number, string> = {
    4: "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10",
    5: "grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10",
    6: "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12",
    7: "grid-cols-7 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12",
    8: "grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14",
  };

  return (
    <div
      className="infinity-container relative min-h-screen w-full overflow-auto"
      style={{
        background: wallpaperUrl ? `url(${wallpaperUrl}) center/cover no-repeat fixed` : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
    >
      {/* 壁纸遮罩 */}
      <div
        className="fixed inset-0 bg-black pointer-events-none"
        style={{ opacity: settings.wallpaperOverlay / 100 }}
      />
      {settings.wallpaperBlur > 0 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ backdropFilter: `blur(${settings.wallpaperBlur}px)` }}
        />
      )}

      {/* 主内容区 */}
      <div className="relative z-10 min-h-screen w-full p-6 md:p-10 lg:p-16">
        {/* 搜索框 - 居中 */}
        {settings.showSearch && (
          <div className="mx-auto mb-10 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索应用..."
                className="w-full rounded-full border border-white/20 bg-white/10 px-6 py-4 text-base text-white placeholder-white/50 backdrop-blur-md focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const query = (e.target as HTMLInputElement).value.toLowerCase();
                    const found = apps.find((a) => a.name.toLowerCase().includes(query) || a.url.toLowerCase().includes(query));
                    if (found) launch(found.id);
                  }
                }}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 rounded bg-white/20 px-2 py-1 text-xs text-white/60">⌘K</span>
            </div>
          </div>
        )}

        {/* 收藏图标区 */}
        {favoriteApps.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/70">⭐ 常用置顶</h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={favoriteApps.map((a) => a.id)} strategy={rectSortingStrategy}>
                <div className={cn("grid gap-5", gridCols[settings.columns] ?? "grid-cols-8")}>
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

        {/* 所有分组 - 全铺展开 */}
        {groups.map((group) => (
          <section key={group.id} className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/70">
              {group.kind === "dept" ? "🏢" : "📁"} {group.name}
              <span className="ml-2 text-white/40">({group.apps.length})</span>
            </h2>
            {group.apps.length > 0 ? (
              <div className={cn("grid gap-5", gridCols[settings.columns] ?? "grid-cols-8")}>
                {group.apps.map((app) => (
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
            ) : (
              <p className="text-sm text-white/40">暂无应用</p>
            )}
          </section>
        ))}

        {/* 添加按钮 */}
        <button
          onClick={() => openNew()}
          className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/30 shadow-lg"
        >
          <span className="text-2xl">+</span>
        </button>
      </div>
    </div>
  );
}
