import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { InfinityGrid } from "@/components/InfinityGrid";
import { InfinitySettingsPanel } from "@/components/InfinitySettings";
import { Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/infinity")({
  component: InfinityPage,
});

function InfinityPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate({ to: "/" })}
        className="fixed left-6 top-6 z-50 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur-md transition-all hover:bg-white/30"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">返回</span>
      </button>

      {/* 设置按钮 */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/30"
      >
        <Settings size={18} />
      </button>

      {/* Infinity 网格 - 全屏 */}
      <InfinityGrid />

      {/* 设置面板 */}
      <InfinitySettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
