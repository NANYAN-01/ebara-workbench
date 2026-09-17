import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { InfinityGrid } from "@/components/InfinityGrid";
import { InfinitySettingsPanel } from "@/components/InfinitySettings";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/_layout/infinity")({
  component: InfinityPage,
});

function InfinityPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative">
      {/* 设置按钮 */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed right-6 top-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
      >
        <Settings size={18} />
      </button>

      {/* Infinity 网格 */}
      <InfinityGrid />

      {/* 设置面板 */}
      <InfinitySettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
