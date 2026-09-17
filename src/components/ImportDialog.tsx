import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { btn, field } from "@/components/ui/button-variants";
import { Upload, FileJson, AlertCircle, CheckCircle2, X } from "lucide-react";
import type { WorkspaceData } from "@/lib/types";

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importConfig, apps, orgGroups } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: WorkspaceData; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!open) return null;

  function reset() {
    setPending(null);
    setError(null);
    setDragOver(false);
  }

  async function handleFile(file?: File | null) {
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text) as Partial<WorkspaceData>;
      if (!json || typeof json !== "object" || !Array.isArray(json.apps)) {
        setError("文件缺少 apps 字段，不是本工作台导出的配置文件");
        setPending(null);
        return;
      }
      if (typeof json.version === "number" && json.version > 1) {
        setError(`配置版本 v${json.version} 高于当前支持的 v1，请先升级工作台`);
        setPending(null);
        return;
      }
      if (!Array.isArray(json.groups) || json.groups.length === 0) {
        setError("文件缺少组织架构（groups），无法确定应用归属");
        setPending(null);
        return;
      }
      setPending({ data: json as WorkspaceData, name: file.name });
    } catch {
      setError("文件不是合法的 JSON，请确认导出后未被修改");
      setPending(null);
    }
  }

  function doImport(mode: "merge" | "replace") {
    if (!pending) return;
    importConfig(pending.data, mode);
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[58] grid place-items-center px-4">
      <button
        aria-label="关闭"
        onClick={() => { reset(); onClose(); }}
        className="fade-in absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
      />
      <section className="panel-in relative w-full max-w-[460px] overflow-hidden rounded-lg border border-border bg-card shadow-xl shadow-foreground/10">
        <header className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div>
            <p className="eyebrow mb-1">配置迁移</p>
            <h2 className="text-[16px] font-medium tracking-tight text-foreground">导入应用清单</h2>
          </div>
          <button onClick={() => { reset(); onClose(); }} className={btn({ variant: "ghost", size: "iconSm" })}>
            <X size={16} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          {!pending ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); void handleFile(e.dataTransfer.files?.[0]); }}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "cursor-pointer rounded-md border border-dashed px-5 py-9 text-center transition-colors",
                  dragOver ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/40 hover:bg-surface",
                )}
              >
                <Upload size={18} className="mx-auto text-subtle" />
                <p className="mt-2.5 text-[13.5px] font-medium text-foreground">选择或拖入导出的 JSON 文件</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  当前清单：{apps.length} 个应用 · {orgGroups.filter((g) => g.kind === "dept").length} 个部门
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
              {error && (
                <p className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-[12.5px] leading-relaxed text-destructive">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-md border border-hairline bg-surface p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-hairline bg-card">
                  <FileJson size={15} className="text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate-1 text-[13.5px] font-medium text-foreground">{pending.name}</p>
                  <p className="num mt-0.5 text-[11.5px] text-subtle">
                    {pending.data.apps.length} 个应用 · {pending.data.groups.length} 个分组
                  </p>
                </div>
                <CheckCircle2 size={15} className="shrink-0 text-ok" />
              </div>

              <div className="space-y-2">
                <button onClick={() => doImport("merge")} className={cn(btn({ variant: "outline", size: "lg" }), "w-full justify-start")}>
                  <span className="flex-1">
                    <span className="block text-[13.5px] font-medium">合并导入</span>
                    <span className="mt-0.5 block text-[11.5px] font-normal text-subtle">保留现有应用，同 ID 以文件为准</span>
                  </span>
                </button>
                <button onClick={() => doImport("replace")} className={cn(btn({ variant: "outline", size: "lg" }), "w-full justify-start")}>
                  <span className="flex-1">
                    <span className="block text-[13.5px] font-medium">整体覆盖</span>
                    <span className="mt-0.5 block text-[11.5px] font-normal text-subtle">用文件内容替换全部清单（覆盖前自动备份）</span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-hairline bg-surface px-5 py-3.5">
          <p className="mr-auto text-[11.5px] text-subtle">导入记录仅保存在本机浏览器</p>
          {pending && (
            <button onClick={reset} className={btn({ variant: "ghost", size: "sm" })}>重新选择</button>
          )}
          <button onClick={() => { reset(); onClose(); }} className={btn({ variant: "outline", size: "sm" })}>取消</button>
        </footer>
      </section>
    </div>
  );
}
