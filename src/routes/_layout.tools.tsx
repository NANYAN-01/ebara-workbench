import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { AppGrid } from "@/components/AppCard";
import { EmptyState, PageHeader, SectionLabel } from "@/components/Bits";
import { btn } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Wrench, Copy, Check, ExternalLink } from "lucide-react";
import { JsonFormatter, TimestampTool, RegexTester, PortBuilder, ColorTool, Base64Tool } from "@/components/builtins/DevTools";

export const Route = createFileRoute("/_layout/tools")({ component: ToolsPage });

const BUILTINS = [
  { id: "json", label: "JSON 格式化", Cmp: JsonFormatter },
  { id: "base64", label: "Base64 / URL 编解码", Cmp: Base64Tool },
  { id: "time", label: "时间戳互转", Cmp: TimestampTool },
  { id: "regex", label: "正则测试", Cmp: RegexTester },
  { id: "port", label: "端口地址拼接", Cmp: PortBuilder },
  { id: "color", label: "颜色与对比度", Cmp: ColorTool },
] as const;

/** 效率工具页：内置离线小工具 + 外部工具导航 */
function ToolsPage() {
  const { apps, orgGroups } = useStore();
  const [tab, setTab] = useState<(typeof BUILTINS)[number]["id"]>("json");
  const Active = BUILTINS.find((b) => b.id === tab)!.Cmp;

  const toolGroupIds = ["g-tools", "g-ai", "g-docs"];
  const externals = apps.filter((a) => toolGroupIds.includes(a.groupId));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="不依赖外网"
        title="效率工具"
        desc="常用的小工具直接内置在这里，断网或内网隔离环境也能用；下方是日常会跳转的外部工具站。"
      />

      {/* 内置工具 */}
      <section className="space-y-4">
        <SectionLabel title="内置小工具" hint={BUILTINS.length + " 个"} />
        <div className="overflow-hidden rounded-md border border-border">
          <div className="flex flex-wrap gap-0.5 border-b border-hairline bg-surface p-1.5">
            {BUILTINS.map((b) => (
              <button
                key={b.id}
                onClick={() => setTab(b.id)}
                className={cn(
                  "rounded px-3 py-1.5 text-[12.5px] transition-colors",
                  tab === b.id ? "bg-card font-medium text-foreground shadow-sm shadow-foreground/5" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div className="bg-card p-5">
            <Active />
          </div>
        </div>
      </section>

      {/* 外部工具导航 */}
      <section className="space-y-4">
        <SectionLabel title="外部工具站" hint="新标签页打开" count={externals.length} />
        {externals.length ? (
          orgGroups
            .filter((g) => toolGroupIds.includes(g.id))
            .map((g) => {
              const list = externals.filter((a) => a.groupId === g.id);
              if (!list.length) return null;
              return (
                <div key={g.id} className="space-y-3">
                  <h3 className="flex items-center gap-2 text-[13px] font-medium text-secondary-foreground">
                    <Wrench size={12} className="text-subtle" /> {g.name}
                  </h3>
                  <AppGrid apps={list} dense cols="2 sm:grid-cols-3 xl:grid-cols-4" />
                </div>
              );
            })
        ) : (
          <EmptyState title="还没有登记外部工具" desc="在应用清单里把类型选为「外部网站」并归入公共资源分组即可。" />
        )}
      </section>
    </div>
  );
}

/** 通用复制按钮（供 DevTools 内部复用） */
export function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); window.setTimeout(() => setOk(false), 1400); }}
      className={btn({ variant: "outline", size: "sm" })}
    >
      {ok ? <Check size={12} /> : <Copy size={12} />} {ok ? "已复制" : "复制"}
    </button>
  );
}

export function OpenBtn({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className={btn({ variant: "ghost", size: "sm" })}>
      <ExternalLink size={12} /> 打开
    </a>
  );
}
