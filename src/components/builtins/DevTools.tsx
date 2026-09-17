import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { btn, field } from "@/components/ui/button-variants";
import { Copy, Check, Plus, X } from "lucide-react";

/* 统一的极简工具外壳：小标题 + 说明 + 输入区 + 输出区 */
function ToolShell({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[14px] font-medium tracking-tight text-foreground">{title}</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function OutBox({ value, mono = true }: { value: string; mono?: boolean }) {
  const [ok, setOk] = useState(false);
  if (!value) return null;
  return (
    <div className="relative">
      <pre className={cn("max-h-[280px] overflow-auto rounded-md border border-hairline bg-surface p-3.5 pr-12 text-[12.5px] leading-relaxed text-secondary-foreground", mono && "num")}>
        {value}
      </pre>
      <button
        onClick={async () => { await navigator.clipboard.writeText(value); setOk(true); window.setTimeout(() => setOk(false), 1400); }}
        className={cn(btn({ variant: "ghost", size: "iconSm" }), "absolute right-1.5 top-1.5 bg-card")}
        aria-label="复制结果"
      >
        {ok ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

/* ── JSON 格式化 / 压缩 ─────────────────────────────── */
export function JsonFormatter() {
  const [src, setSrc] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function run(minify: boolean) {
    if (!src.trim()) { setOut(""); setErr(null); return; }
    try {
      const obj = JSON.parse(src);
      setOut(minify ? JSON.stringify(obj) : JSON.stringify(obj, null, 2));
      setErr(null);
    } catch (e) {
      setOut("");
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <ToolShell title="JSON 格式化" desc="粘贴一段 JSON，格式化为缩进良好的结构，或反向压缩成单行。解析失败会给出具体原因。">
      <textarea value={src} onChange={(e) => setSrc(e.target.value)} rows={7} placeholder='{"name":"Ebara","ports":[3015,8080]}' className={cn(field, "num resize-y leading-relaxed")} />
      <div className="flex gap-2">
        <button onClick={() => run(false)} className={btn({ variant: "primary", size: "sm" })}>格式化</button>
        <button onClick={() => run(true)} className={btn({ variant: "outline", size: "sm" })}>压缩</button>
        <button onClick={() => { setSrc(""); setOut(""); setErr(null); }} className={btn({ variant: "ghost", size: "sm" })}>清空</button>
      </div>
      {err && <p className="num rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12px] leading-relaxed text-destructive">{err}</p>}
      <OutBox value={out} />
    </ToolShell>
  );
}

/* ── Base64 / URL 编解码 ───────────────────────────── */
export function Base64Tool() {
  const [src, setSrc] = useState("");
  const [mode, setMode] = useState<"b64" | "url">("b64");
  const [dir, setDir] = useState<"enc" | "dec">("enc");
  const [err, setErr] = useState<string | null>(null);

  const out = useMemo(() => {
    if (!src) return "";
    try {
      setErr(null);
      if (mode === "b64") {
        return dir === "enc"
          ? btoa(unescape(encodeURIComponent(src)))
          : decodeURIComponent(escape(atob(src.trim())));
      }
      return dir === "enc" ? encodeURIComponent(src) : decodeURIComponent(src);
    } catch {
      setErr("输入不是合法的 Base64 字符串，无法解码");
      return "";
    }
  }, [src, mode, dir]);

  return (
    <ToolShell title="Base64 / URL 编解码" desc="支持中文的 Base64 互转，以及 URI 组件级的编码与解码。">
      <div className="flex flex-wrap gap-1.5">
        {([["b64", "Base64"], ["url", "URL"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)} className={btn({ variant: mode === v ? "primary" : "outline", size: "sm" })}>{l}</button>
        ))}
        <span className="mx-1 h-6 self-center w-px bg-hairline" />
        {([["enc", "编码"], ["dec", "解码"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setDir(v)} className={btn({ variant: dir === v ? "primary" : "outline", size: "sm" })}>{l}</button>
        ))}
      </div>
      <textarea value={src} onChange={(e) => setSrc(e.target.value)} rows={6} placeholder={dir === "enc" ? "输入要编码的文本…" : "输入要解码的内容…"} className={cn(field, "num resize-y leading-relaxed")} />
      {err && <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">{err}</p>}
      <OutBox value={out} />
    </ToolShell>
  );
}

/* ── 时间戳互转 ─────────────────────────────────────── */
export function TimestampTool() {
  const [ts, setTs] = useState(String(Date.now()));
  const [dateStr, setDateStr] = useState("");

  const parsed = useMemo(() => {
    const n = Number(ts.trim());
    if (!Number.isFinite(n) || ts.trim() === "") return null;
    // 10 位按秒处理，13 位按毫秒处理
    const ms = ts.trim().length === 10 ? n * 1000 : n;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return {
      local: d.toLocaleString("zh-CN", { hour12: false }),
      iso: d.toISOString(),
      ms: String(ms),
      sec: String(Math.floor(ms / 1000)),
      rel: relDays(ms),
    };
  }, [ts]);

  const fromDate = useMemo(() => {
    if (!dateStr) return null;
    const d = new Date(dateStr.replace(/-/g, "/"));
    if (Number.isNaN(d.getTime())) return null;
    return { ms: String(d.getTime()), sec: String(Math.floor(d.getTime() / 1000)) };
  }, [dateStr]);

  return (
    <ToolShell title="时间戳互转" desc="10 位（秒）与 13 位（毫秒）时间戳自动识别，双向换算为本地时间与 ISO 时间。">
      <div className="flex items-center justify-between rounded-md border border-hairline bg-surface px-3.5 py-2.5">
        <span className="num text-[12.5px] text-muted-foreground">{Date.now()}</span>
        <button onClick={() => setTs(String(Date.now()))} className={btn({ variant: "outline", size: "sm" })}>取当前时间戳</button>
      </div>
      <input value={ts} onChange={(e) => setTs(e.target.value)} placeholder="粘贴时间戳，如 1789530043853" className={cn(field, "num")} />
      {parsed && (
        <dl className="divide-y divide-hairline rounded-md border border-hairline">
          {[["本地时间", parsed.local], ["ISO 时间", parsed.iso], ["毫秒", parsed.ms], ["秒", parsed.sec], ["距今", parsed.rel]].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3 px-3.5 py-2">
              <dt className="w-16 shrink-0 text-[12px] text-subtle">{k}</dt>
              <dd className="num min-w-0 flex-1 truncate text-[12.5px] text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="pt-1">
        <p className="mb-1.5 text-[12.5px] font-medium text-secondary-foreground">日期 → 时间戳</p>
        <input value={dateStr} onChange={(e) => setDateStr(e.target.value)} placeholder="2026-09-16 12:00:00" className={cn(field, "num")} />
        {fromDate && (
          <div className="mt-2 flex gap-4 text-[12.5px]">
            <span className="text-subtle">毫秒 <span className="num text-foreground">{fromDate.ms}</span></span>
            <span className="text-subtle">秒 <span className="num text-foreground">{fromDate.sec}</span></span>
          </div>
        )}
      </div>
    </ToolShell>
  );
}

function relDays(ms: number) {
  const diff = Date.now() - ms;
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? "前" : "后";
  const d = Math.floor(abs / 86_400_000);
  if (d >= 1) return `${d} 天${suffix}`;
  const h = Math.floor(abs / 3_600_000);
  if (h >= 1) return `${h} 小时${suffix}`;
  const m = Math.floor(abs / 60_000);
  return m >= 1 ? `${m} 分钟${suffix}` : "同一分钟";
}

/* ── 正则测试 ───────────────────────────────────────── */
export function RegexTester() {
  const [pattern, setPattern] = useState("\\d{1,3}(\\.\\d{1,3}){3}");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("服务器 192.168.1.30 与网关 192.168.1.1 均在网段内");
  const [bad, setBad] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!pattern) return [];
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      setBad(null);
      const hits: { match: string; index: number }[] = [];
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(text)) !== null && guard++ < 200) {
        if (m.index === re.lastIndex) re.lastIndex++;
        hits.push({ match: m[0], index: m.index });
        if (!flags.includes("g")) break;
      }
      return hits;
    } catch (e) {
      setBad(e instanceof Error ? e.message : String(e));
      return [];
    }
  }, [pattern, flags, text]);

  return (
    <ToolShell title="正则测试" desc="实时匹配高亮，用于校验 IP、工号、BOM 编号等内网常见格式。">
      <div className="grid gap-2 sm:grid-cols-[1fr_88px]">
        <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="输入正则表达式" className={cn(field, "num")} />
        <input value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="gi" className={cn(field, "num text-center")} />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className={cn(field, "num resize-y leading-relaxed")} />
      {bad && <p className="num rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">{bad}</p>}
      {!bad && (
        <div className="rounded-md border border-hairline bg-surface p-3.5 text-[12.5px] leading-relaxed text-secondary-foreground">
          {result.length === 0 ? (
            <span className="text-subtle">无匹配</span>
          ) : (
            highlight(text, result)
          )}
        </div>
      )}
      {!bad && <p className="num text-[11.5px] text-subtle">共 {result.length} 处匹配</p>}
    </ToolShell>
  );
}

function highlight(text: string, hits: { match: string; index: number }[]) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  hits.forEach((h, i) => {
    if (h.index > cursor) parts.push(text.slice(cursor, h.index));
    parts.push(<mark key={i} className="rounded-sm bg-accent/15 px-0.5 text-accent">{h.match}</mark>);
    cursor = h.index + h.match.length;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

/* ── 端口地址拼接 ───────────────────────────────────── */
export function PortBuilder() {
  const [rows, setRows] = useState([{ ip: "192.168.1.", port: "3015", path: "" }]);
  const [ok, setOk] = useState(false);

  const lines = rows
    .filter((r) => r.ip.trim())
    .map((r) => `http://${r.ip.trim()}${r.port.trim() ? `:${r.port.trim()}` : ""}${r.path.trim() ? `/${r.path.trim().replace(/^\/+/, "")}` : "/"}`);

  return (
    <ToolShell title="端口地址拼接" desc="把散落的 IP 与端口批量拼成可访问地址，整理好后一键复制去登记应用。">
      <div className="space-y-1.5">
        <div className="grid grid-cols-[1fr_84px_1fr_30px] gap-1.5 px-0.5">
          {["IP / 主机", "端口", "子路径", ""].map((h, i) => <span key={i} className="eyebrow text-[10px]">{h}</span>)}
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_84px_1fr_30px] items-center gap-1.5">
            <input value={r.ip} onChange={(e) => patch(i, { ip: e.target.value })} placeholder="192.168.1.30" className={cn(field, "num !py-1.5 text-[12.5px]")} />
            <input value={r.port} onChange={(e) => patch(i, { port: e.target.value })} placeholder="3015" className={cn(field, "num !py-1.5 text-center text-[12.5px]")} />
            <input value={r.path} onChange={(e) => patch(i, { path: e.target.value })} placeholder="可选" className={cn(field, "num !py-1.5 text-[12.5px]")} />
            <button onClick={() => setRows((rs) => (rs.length === 1 ? [{ ip: "", port: "", path: "" }] : rs.filter((_, x) => x !== i)))} className={btn({ variant: "ghost", size: "iconSm" })} aria-label="删除该行">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => setRows((rs) => [...rs, { ip: "", port: "", path: "" }])} className={btn({ variant: "outline", size: "sm" })}>
        <Plus size={12} />添加一行
      </button>
      {lines.length > 0 && (
        <div className="relative">
          <pre className="num max-h-[200px] overflow-auto rounded-md border border-hairline bg-surface p-3.5 pr-12 text-[12.5px] leading-[1.9] text-secondary-foreground">{lines.join("\n")}</pre>
          <button
            onClick={async () => { await navigator.clipboard.writeText(lines.join("\n")); setOk(true); window.setTimeout(() => setOk(false), 1400); }}
            className={cn(btn({ variant: "ghost", size: "iconSm" }), "absolute right-1.5 top-1.5 bg-card")}
            aria-label="复制全部地址"
          >
            {ok ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      )}
    </ToolShell>
  );

  function patch(i: number, p: Partial<{ ip: string; port: string; path: string }>) {
    setRows((rs) => rs.map((r, x) => (x === i ? { ...r, ...p } : r)));
  }
}

/* ── 颜色与对比度 ───────────────────────────────────── */
export function ColorTool() {
  const [fg, setFg] = useState("#3d3d3d");
  const [bg, setBg] = useState("#ffffff");

  const ratio = useMemo(() => contrast(fg, bg), [fg, bg]);
  const verdict = ratio >= 7 ? "AAA 正文可用" : ratio >= 4.5 ? "AA 正文可用" : ratio >= 3 ? "仅适合大字" : "对比不足，需加深或提亮";

  return (
    <ToolShell title="颜色与对比度" desc="检查内网系统的文字配色是否够清楚，同时给出 HEX 与 RGB 两种写法。">
      <div className="grid grid-cols-2 gap-3">
        {[["前景色", fg, setFg], ["背景色", bg, setBg]].map(([label, val, set]) => (
          <label key={label as string} className="block">
            <span className="mb-1.5 block text-[12px] text-muted-foreground">{label as string}</span>
            <div className="flex items-center gap-2 rounded-md border border-input bg-card px-2 py-1.5">
              <input type="color" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />
              <input value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} className="num w-full min-w-0 bg-transparent text-[12.5px] uppercase outline-none" />
            </div>
          </label>
        ))}
      </div>
      <div className="rounded-md border border-hairline p-4 text-center" style={{ color: fg, background: bg }}>
        <p className="text-[15px] font-medium">研发中心工作台 EBARA 192.168.1.30</p>
        <p className="mt-1 text-[12px] opacity-90">这是实际渲染出来的效果预览</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-hairline bg-surface px-3.5 py-3">
        <span className="num text-[18px] font-medium text-foreground">{ratio.toFixed(2)}</span>
        <span className="text-[12.5px] text-muted-foreground">{verdict}</span>
        <span className="num ml-auto text-[11.5px] text-subtle">{hex2rgb(fg)} · {hex2rgb(bg)}</span>
      </div>
    </ToolShell>
  );
}

function lum(hex: string) {
  const c = normalize(hex);
  if (!c) return 0;
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const l1 = lum(a); const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function normalize(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}
function hex2rgb(hex: string) {
  const c = normalize(hex);
  return c ? `rgb(${c.join(", ")})` : "—";
}
