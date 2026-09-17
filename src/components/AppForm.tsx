import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { btn, field } from "@/components/ui/button-variants";
import { AppGlyph } from "@/components/AppGlyph";
import { readAvatarOverride, writeAvatarOverride } from "@/lib/logo";
import { X, Trash2, Link2, Server, ImagePlus } from "lucide-react";
import type { GlyphColor, WorkApp } from "@/lib/types";

const GLYPHS: GlyphColor[] = ["grape", "sky", "mint", "peach", "rose", "sea", "ink"];

const TYPE_OPTS: { v: WorkApp["type"]; label: string }[] = [
  { v: "internal", label: "内部服务" },
  { v: "platform", label: "公司平台" },
  { v: "external", label: "外部网站" },
];

const STATUS_OPTS: { v: WorkApp["status"]; label: string }[] = [
  { v: "active", label: "正常" },
  { v: "maintenance", label: "维护中" },
  { v: "offline", label: "停用" },
];

/** 从 URL 拆出主机与端口，用于 IP+端口模式回填 */
function splitHost(url: string): { ip: string; port: string; path: string } | null {
  try {
    const u = new URL(url);
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) return null;
    const segs = url.split(u.host + "");
    return { ip: u.hostname, port: u.port || "", path: (segs[1] ?? "").replace(/^\//, "") };
  } catch {
    return null;
  }
}

export function AppFormDrawer({
  open,
  app,
  presetGroup,
  presetSection,
  presetName,
  onClose,
}: {
  open: boolean;
  app?: WorkApp;
  presetGroup?: string;
  presetSection?: string;
  presetName?: string;
  onClose: () => void;
}) {
  const { orgGroups, apps, upsertApp, removeApp } = useStore();
  const [mode, setMode] = useState<"url" | "host">("url");
  const [form, setForm] = useState<WorkApp>(blank());
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [path, setPath] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickAvatar(file: File | undefined) {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast.error("请选择图片文件");
    if (file.size > 300 * 1024) return toast.error("图片请控制在 300KB 以内");
    const r = new FileReader();
    r.onload = () => { setAvatar(String(r.result)); setDirty(true); };
    r.readAsDataURL(file);
  }

  function blank(): WorkApp {
    return {
      id: "", name: "", url: "", groupId: presetGroup ?? orgGroups[0]?.id ?? "",
      sectionId: presetSection ?? "", type: "internal", desc: "", owner: "",
      tags: [], glyph: "ink", status: "active", intranet: true, enabled: true, favorite: false,
      createdAt: 0, updatedAt: 0,
    };
  }

  // 打开时回填
  useEffect(() => {
    if (!open) return;
    setErr(null);
    setDirty(false);
    setConfirmClose(false);
    if (app) {
      setForm({ ...app });
      setAvatar(readAvatarOverride(app.id));
      const h = splitHost(app.url);
      if (h) { setMode("host"); setIp(h.ip); setPort(h.port); setPath(h.path); }
      else { setMode("url"); setIp(""); setPort(""); setPath(""); }
    } else {
      const b = blank();
      b.name = presetName ?? "";
      setForm(b);
      setAvatar(null);
      setMode("url"); setIp(""); setPort(""); setPath("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, app?.id]);

  const group = orgGroups.find((g) => g.id === form.groupId);
  const finalUrl = useMemo(() => {
    if (mode === "url") return form.url.trim();
    if (!ip.trim()) return "";
    const p = port.trim() ? `:${port.trim()}` : "";
    const tail = path.trim().replace(/^\/+/, "");
    return `http://${ip.trim()}${p}${tail ? `/${tail}` : "/"}`;
  }, [mode, form.url, ip, port, path]);

  const dupName = !app && !!form.name.trim()
    && apps.some((a) => a.name.trim() === form.name.trim());

  function patch(p: Partial<WorkApp>) {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  }

  function submit() {
    const name = form.name.trim();
    if (!name) return setErr("请填写应用名称");
    if (!finalUrl) return setErr(mode === "url" ? "请填写访问地址" : "请填写服务器 IP");
    let url = finalUrl;
    if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
    url = url.replace(/\s+/g, "%20");
    try { new URL(url); } catch { return setErr("地址格式无法识别，请检查拼写"); }

    const savedId = app?.id ?? "";
    const realId = upsertApp({
      ...form,
      id: savedId,
      name,
      url,
      sectionId: group?.kind === "dept" ? form.sectionId : "",
      tags: Array.isArray(form.tags) ? form.tags.filter(Boolean) : [],
    });
    if (avatar !== readAvatarOverride(realId)) writeAvatarOverride(realId, avatar);
    onClose();
  }

  function tryClose() {
    if (dirty && !confirmClose) { setConfirmClose(true); return; }
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && tryClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty, confirmClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button aria-label="关闭" onClick={tryClose} className="fade-in absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" />
      <section className="sheet-in relative flex h-full w-full max-w-[480px] flex-col border-l border-border bg-card">
        <header className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div>
            <p className="eyebrow mb-1">{app ? "编辑应用" : "新增应用"}</p>
            <h2 className="text-[16px] font-medium tracking-tight text-foreground">
              {app?.name || form.name || "未命名应用"}
            </h2>
          </div>
          <button onClick={tryClose} className={btn({ variant: "ghost", size: "iconSm" })}><X size={16} /></button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* 预览条 */}
          <div className="flex items-center gap-3 rounded-md border border-hairline bg-surface p-3">
            {avatar ? (
              <img src={avatar} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" />
            ) : (
              <AppGlyph name={form.name || "?"} color={form.glyph} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate-1 text-[13.5px] font-bold text-foreground">{form.name || "应用名称"}</p>
              <p className="num truncate-1 text-[11.5px] text-subtle">{finalUrl ? finalUrl.replace(/^https?:\/\//, "") : "访问地址待填写"}</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
            {avatar ? (
              <button onClick={() => { setAvatar(null); setDirty(true); }} className={btn({ variant: "ghost", size: "sm" })}>恢复自动</button>
            ) : (
              <button onClick={() => fileRef.current?.click()} className={cn(btn({ variant: "outline", size: "sm" }), "shrink-0")}>
                <ImagePlus size={12} /> 上传图标
              </button>
            )}
          </div>
          <p className="-mt-3 text-[11.5px] leading-relaxed text-subtle">
            默认自动抓取网站图标（favicon）；内网系统或抓取不到时可手动上传一张图片作为图标。
          </p>

          <Row label="应用名称" required>
            <input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="如：项目任务看板" className={field} />
          </Row>

          {dupName && (
            <p className="-mt-3 text-[12px] text-warn">已存在同名应用，确认不是重复登记</p>
          )}

          <Row label="访问方式">
            <div className="flex gap-1 rounded-md border border-hairline bg-surface p-1">
              {[
                { v: "url" as const, icon: Link2, label: "完整地址" },
                { v: "host" as const, icon: Server, label: "IP + 端口" },
              ].map((m) => (
                <button
                  key={m.v}
                  onClick={() => setMode(m.v)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-[12.5px] transition-colors",
                    mode === m.v ? "bg-card font-medium text-foreground shadow-sm shadow-foreground/5" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <m.icon size={12} /> {m.label}
                </button>
              ))}
            </div>
          </Row>

          {mode === "url" ? (
            <Row label="访问地址" required>
              <input value={form.url} onChange={(e) => patch({ url: e.target.value })} placeholder="http://192.168.1.6/erp/…" className={cn(field, "num")} />
            </Row>
          ) : (
            <>
              <Row label="服务器 IP / 主机" required>
                <input value={ip} onChange={(e) => { setIp(e.target.value); setDirty(true); }} placeholder="192.168.1.30" className={cn(field, "num")} />
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row label="端口">
                  <input value={port} onChange={(e) => { setPort(e.target.value); setDirty(true); }} placeholder="3000" inputMode="numeric" className={cn(field, "num")} />
                </Row>
                <Row label="子路径">
                  <input value={path} onChange={(e) => { setPath(e.target.value); setDirty(true); }} placeholder="可选，如 /admin" className={cn(field, "num")} />
                </Row>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Row label="所属部门">
              <select
                value={form.groupId}
                onChange={(e) => patch({ groupId: e.target.value, sectionId: "" })}
                className={field}
              >
                {orgGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Row>
            <Row label={group?.kind === "dept" ? "所属科室" : "公共分组"}>
              {group?.kind === "dept" && group.sections.length > 0 ? (
                <select value={form.sectionId} onChange={(e) => patch({ sectionId: e.target.value })} className={field}>
                  <option value="">未指定科室</option>
                  {group.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <input disabled value={group?.kind === "dept" ? "该部门暂无科室" : (group?.name ?? "—")} className={cn(field, "opacity-55")} />
              )}
            </Row>
          </div>

          <Row label="应用类型">
            <div className="flex flex-wrap gap-1.5">
              {TYPE_OPTS.map((t) => (
                <button key={t.v} onClick={() => patch({ type: t.v })} className={btn({ variant: form.type === t.v ? "primary" : "outline", size: "sm" })}>
                  {t.label}
                </button>
              ))}
            </div>
          </Row>

          <Row label="运行状态">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTS.map((t) => (
                <button key={t.v} onClick={() => patch({ status: t.v })} className={btn({ variant: form.status === t.v ? "primary" : "outline", size: "sm" })}>
                  {t.label}
                </button>
              ))}
            </div>
          </Row>

          <Row label="一句话说明">
            <textarea value={form.desc ?? ""} onChange={(e) => patch({ desc: e.target.value })} rows={2} placeholder="这个系统用来做什么，给同事看的一句介绍" className={cn(field, "resize-none leading-relaxed")} />
          </Row>

          <div className="grid grid-cols-2 gap-3">
            <Row label="负责人 / 团队">
              <input value={form.owner ?? ""} onChange={(e) => patch({ owner: e.target.value })} placeholder="如：开发科 · 张工" className={field} />
            </Row>
            <Row label="标签（逗号分隔）">
              <input value={(form.tags ?? []).join("，")} onChange={(e) => patch({ tags: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} placeholder="ERP，内网" className={field} />
            </Row>
          </div>

          <Row label="图标色调">
            <div className="flex gap-1.5">
              {GLYPHS.map((g) => (
                <button
                  key={g}
                  onClick={() => patch({ glyph: g })}
                  aria-label={`图标色 ${g}`}
                  className={cn("rounded-md transition-all", form.glyph === g ? "ring-2 ring-accent ring-offset-2 ring-offset-card" : "hover:opacity-80")}
                >
                  <AppGlyph name={form.name || "A"} color={g} size="sm" />
                </button>
              ))}
            </div>
          </Row>

          <div className="flex items-center justify-between rounded-md border border-hairline bg-surface px-3.5 py-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">需要内网才能访问</p>
              <p className="mt-0.5 text-[11.5px] text-subtle">在卡片上显示「内网」提示徽章</p>
            </div>
            <button role="switch" aria-checked={form.intranet} onClick={() => patch({ intranet: !form.intranet })} className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", form.intranet ? "bg-accent" : "bg-input")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", form.intranet ? "translate-x-[18px]" : "translate-x-0.5")} />
            </button>
          </div>

          {err && <p className="text-[12.5px] text-destructive">{err}</p>}
        </div>

        <footer className="flex items-center gap-2 border-t border-hairline px-5 py-4">
          {app && (
            <button
              onClick={() => { if (window.confirm(`确定删除「${app.name}」？${app.favorite ? "该应用已在你的常用置顶中，删除后会一并移除。" : ""}`)) { removeApp(app.id); onClose(); } }}
              className={btn({ variant: "danger", size: "md" })}
            >
              <Trash2 size={13} /> 删除
            </button>
          )}
          <button onClick={tryClose} className={cn(btn({ variant: "outline", size: "md" }), "ml-auto")}>取消</button>
          <button onClick={submit} className={btn({ variant: "primary", size: "md" })}>{app ? "保存修改" : "创建应用"}</button>
        </footer>

        {confirmClose && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-background/70 p-6 fade-in">
            <div className="panel-in w-full max-w-[320px] rounded-lg border border-border bg-card p-5 text-center">
              <p className="text-[14px] font-medium text-foreground">放弃本次修改？</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">表单里有尚未保存的内容，关闭后将丢失。</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setConfirmClose(false)} className={cn(btn({ variant: "outline", size: "md" }), "flex-1")}>继续编辑</button>
                <button onClick={onClose} className={cn(btn({ variant: "primary", size: "md" }), "flex-1")}>放弃修改</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-secondary-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
