import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AppStatus } from "@/lib/types";

/* ── 区块标题：小标签 + 细横线，安静写法 ───────────────────── */
export function SectionLabel({
  title,
  hint,
  count,
  action,
  className,
}: {
  title: string;
  hint?: string;
  count?: number;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3", className)}>
      <h2 className="shrink-0 text-[15px] font-medium tracking-tight text-foreground">
        {title}
      </h2>
      {typeof count === "number" && (
        <span className="num shrink-0 text-[12px] text-subtle">{count}</span>
      )}
      {hint && <span className="shrink-0 text-[12px] text-subtle">{hint}</span>}
      <span className="hidden h-px flex-1 bg-hairline sm:block" />
      {action && <span className="ml-auto flex shrink-0 items-center gap-1">{action}</span>}
    </div>
  );
}

/* ── 行内数字组：替代原来的四张大指标卡 ─────────────────── */
export function StatInline({
  items,
  className,
}: {
  items: { label: string; value: ReactNode; unit?: string; note?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
      {items.map((it, i) => (
        <div key={it.label} className="flex items-center gap-6">
          {i > 0 && <span className="hidden h-7 w-px bg-hairline sm:block" />}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="num text-[19px] font-medium leading-none tracking-tight text-foreground">
                {it.value}
              </span>
              {it.unit && <span className="text-[12px] text-subtle">{it.unit}</span>}
            </div>
            <div className="mt-1.5 text-[12px] leading-none text-muted-foreground">
              {it.label}
              {it.note && <span className="text-subtle"> · {it.note}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 状态：小圆点 + 灰色文字，不再用色块徽章 ──────────────── */
const STATUS_DOT: Record<AppStatus, string> = {
  active: "bg-ok",
  maintenance: "bg-warn",
  offline: "bg-off",
};
const STATUS_TEXT: Record<AppStatus, string> = {
  active: "正常",
  maintenance: "维护中",
  offline: "停用",
};

export function StatusDot({ status, showText = true }: { status: AppStatus; showText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {showText && <span className="text-[12px] text-subtle">{STATUS_TEXT[status]}</span>}
    </span>
  );
}

/* ── 极轻量标签：描边而非填充 ───────────────────────────── */
export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "outline" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] leading-[1.5] whitespace-nowrap",
        tone === "default" && "bg-surface text-muted-foreground",
        tone === "outline" && "border border-hairline text-muted-foreground",
        tone === "accent" && "border-t-grape/25 bg-t-grape/10 text-t-grape",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── 空态 ─────────────────────────────────────────────── */
export function EmptyState({
  title,
  desc,
  action,
  className,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 rounded-md border border-dashed border-border px-6 py-10",
        className,
      )}
    >
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      {desc && <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">{desc}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ── 页面标题区 ────────────────────────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[22px] font-medium leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {desc && <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{desc}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}
