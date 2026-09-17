import { useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { btn } from "@/components/ui/button-variants";
import { Settings, X, Check } from "lucide-react";
import type { InfinitySettings, IconSize } from "@/lib/types";

const BUILTIN_WALLPAPERS = [
  { url: "", name: "渐变紫", preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80", name: "雪山" },
  { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80", name: "森林" },
  { url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80", name: "绿林" },
  { url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80", name: "田野" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80", name: "海滩" },
  { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80", name: "星空" },
];

const ICON_SIZES: { value: IconSize; label: string; desc: string }[] = [
  { value: "sm", label: "小", desc: "48px" },
  { value: "md", label: "中", desc: "64px" },
  { value: "lg", label: "大", desc: "80px" },
];

export function InfinitySettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, updateInfinitySettings } = useStore();
  const settings: InfinitySettings = data.infinitySettings ?? {
    iconSize: "md",
    iconRadius: 20,
    columns: 6,
    wallpaperType: "builtin",
    wallpaperIndex: 0,
    wallpaperUrl: "",
    wallpaperBlur: 0,
    wallpaperOverlay: 30,
    showSearch: true,
  };

  const [localSettings, setLocalSettings] = useState<InfinitySettings>(settings);

  if (!open) return null;

  function handleSave() {
    updateInfinitySettings(localSettings);
    onClose();
  }

  function update<K extends keyof InfinitySettings>(key: K, value: InfinitySettings[K]) {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-medium">Infinity 设置</h2>
          </div>
          <button onClick={onClose} className={btn({ variant: "ghost", size: "iconSm" })}>
            <X size={16} />
          </button>
        </div>

        {/* 内容 */}
        <div className="space-y-5 px-5 py-5">
          {/* 图标大小 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">图标大小</label>
            <div className="flex gap-2">
              {ICON_SIZES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update("iconSize", opt.value)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-center text-xs transition-colors",
                    localSettings.iconSize === opt.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border hover:border-muted-foreground/40",
                  )}
                >
                  <span className="block font-medium">{opt.label}</span>
                  <span className="text-[10px] text-subtle">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 圆角弧度 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              圆角弧度: {localSettings.iconRadius}%
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={localSettings.iconRadius}
              onChange={(e) => update("iconRadius", Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 每行列数 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              每行列数: {localSettings.columns}
            </label>
            <input
              type="range"
              min="4"
              max="8"
              value={localSettings.columns}
              onChange={(e) => update("columns", Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 壁纸选择 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">壁纸</label>
            <div className="grid grid-cols-4 gap-2">
              {BUILTIN_WALLPAPERS.map((wp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    update("wallpaperType", "builtin");
                    update("wallpaperIndex", i);
                  }}
                  className={cn(
                    "relative h-16 overflow-hidden rounded-md border-2 transition-colors",
                    localSettings.wallpaperType === "builtin" && localSettings.wallpaperIndex === i
                      ? "border-accent"
                      : "border-transparent hover:border-muted-foreground/40",
                  )}
                >
                  {wp.url ? (
                    <img src={wp.url} alt={wp.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: wp.preview }} />
                  )}
                  {localSettings.wallpaperType === "builtin" && localSettings.wallpaperIndex === i && (
                    <div className="absolute inset-0 flex items-center justify-center bg-accent/20">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
              {/* 自定义壁纸 */}
              <button
                onClick={() => update("wallpaperType", "custom")}
                className={cn(
                  "flex h-16 items-center justify-center rounded-md border-2 border-dashed transition-colors",
                  localSettings.wallpaperType === "custom"
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-muted-foreground/40",
                )}
              >
                <span className="text-[10px] text-subtle">自定义</span>
              </button>
            </div>

            {/* 自定义壁纸 URL */}
            {localSettings.wallpaperType === "custom" && (
              <input
                type="text"
                placeholder="输入图片 URL..."
                value={localSettings.wallpaperUrl}
                onChange={(e) => update("wallpaperUrl", e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs"
              />
            )}
          </div>

          {/* 壁纸模糊度 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              模糊度: {localSettings.wallpaperBlur}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={localSettings.wallpaperBlur}
              onChange={(e) => update("wallpaperBlur", Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 壁纸遮罩浓度 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              遮罩浓度: {localSettings.wallpaperOverlay}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={localSettings.wallpaperOverlay}
              onChange={(e) => update("wallpaperOverlay", Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 显示搜索框 */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">显示搜索框</label>
            <button
              onClick={() => update("showSearch", !localSettings.showSearch)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                localSettings.showSearch ? "bg-accent" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  localSettings.showSearch ? "left-4.5" : "left-0.5",
                )}
              />
            </button>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 border-t border-hairline px-5 py-4">
          <button onClick={onClose} className={btn({ variant: "outline", size: "sm" })}>
            取消
          </button>
          <button onClick={handleSave} className={btn({ variant: "primary", size: "sm" })}>
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
