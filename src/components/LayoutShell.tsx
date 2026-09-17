import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { WorkspaceProvider } from "@/lib/layout-context";
import { TopBar } from "@/components/TopBar";
import { GroupTabs } from "@/components/GroupTabs";
import { SearchPalette } from "@/components/SearchPalette";
import { AppFormDrawer } from "@/components/AppForm";
import { ImportDialog } from "@/components/ImportDialog";
import { Toaster } from "sonner";
import type { WorkApp } from "@/lib/types";

/** 全站布局壳：顶栏 + 横向分组标签 + 主区，浮层统一在此编排 */
export function LayoutShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<{ open: boolean; app?: WorkApp; presetGroup?: string; presetSection?: string; presetName?: string }>({ open: false });

  return (
    <WorkspaceProvider
      value={{
        searchOpen,
        setSearchOpen,
        importOpen,
        setImportOpen,
        openSearch: () => setSearchOpen(true),
        openImport: () => setImportOpen(true),
        openNew: (preset) => setForm({ open: true, ...preset }),
        openEdit: (app) => setForm({ open: true, app }),
        closeForm: () => setForm({ open: false }),
      }}
    >
      <div className="min-h-screen bg-background">
        <TopBar />
        <GroupTabs />
        <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-hairline py-6">
          <p className="mx-auto w-full max-w-[1240px] px-4 text-[12px] text-subtle sm:px-6 lg:px-8">
            EBARA 研发中心 · 内网访问 · 清单保存在本机浏览器，可用顶栏「导出配置」与同事共享同一份应用表
          </p>
        </footer>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AppFormDrawer
        open={form.open}
        app={form.app}
        presetGroup={form.presetGroup}
        presetSection={form.presetSection}
        presetName={form.presetName}
        onClose={() => setForm({ open: false })}
      />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />
    </WorkspaceProvider>
  );
}
