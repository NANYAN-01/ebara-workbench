import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/layout-context";
import { groupColorOf, toneOf } from "@/lib/group-tone";
import { AppGrid } from "@/components/AppCard";
import { Chip, EmptyState, PageHeader, SectionLabel } from "@/components/Bits";
import { btn } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Plus, ChevronRight } from "lucide-react";

/** 部门页 / 科室页 / 公共分组页共用视图 */
export function GroupView() {
  const { deptId, sectionId, groupId } = useParams({ strict: false }) as { deptId?: string; sectionId?: string; groupId?: string };
  const { orgGroups, apps, addSection, renameSection, removeSection } = useStore();
  const { openNew } = useWorkspace();
  const [editing, setEditing] = useState<string | null>(null);

  const targetId = deptId ?? groupId;
  const group = orgGroups.find((g) => g.id === targetId);
  if (!group) return <EmptyState title="分组不存在" desc="它可能已被删除。" action={<Link to="/" className={btn({ variant: "outline", size: "sm" })}>返回首页</Link>} />;

  const section = sectionId ? group.sections.find((s) => s.id === sectionId) : undefined;
  const list = apps.filter((a) => (sectionId ? a.sectionId === sectionId : a.groupId === group.id));
  const tone = toneOf(groupColorOf(group.id, orgGroups.indexOf(group)));

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1 text-[12.5px] text-subtle">
        <Link to="/" className="transition-colors hover:text-foreground">首页</Link>
        <ChevronRight size={12} />
        <Link to={group.kind === "dept" ? "/dept/$deptId" : "/group/$groupId"} params={{ deptId: group.id, groupId: group.id } as never} className={cn("transition-colors hover:text-foreground", section && "text-muted-foreground")}>
          {group.name}
        </Link>
        {section && (<><ChevronRight size={12} /><span className="text-foreground">{section.name}</span></>)}
      </nav>

      <PageHeader
        eyebrow={group.kind === "dept" ? "部门" : "公共资源"}
        title={section ? `${group.name} · ${section.name}` : group.name}
        desc={group.desc}
        action={
          <button onClick={() => openNew({ presetGroup: group.id, presetSection: section?.id ?? group.sections[0]?.id })} className={btn({ variant: "primary", size: "sm" })}>
            <Plus size={14} />新增应用
          </button>
        }
      />

      {/* 科室标签（仅部门页） */}
      {group.kind === "dept" && !sectionId && group.sections.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline pb-4">
          <Link to="/dept/$deptId" params={{ deptId: group.id }} className={cn(btn({ variant: "subtle", size: "sm" }), tone.soft, tone.text)}>
            全部 {apps.filter((a) => a.groupId === group.id).length}
          </Link>
          {group.sections.map((s) => (
            <div key={s.id} className="group/sec relative">
              <Link
                to="/dept/$deptId/$sectionId"
                params={{ deptId: group.id, sectionId: s.id }}
                className={cn(btn({ variant: "outline", size: "sm" }))}
              >
                {s.name}
                <span className="num ml-1 text-[11px] text-subtle">{apps.filter((a) => a.sectionId === s.id).length}</span>
              </Link>
            </div>
          ))}
          <AddSectionBtn onAdd={(name) => addSection(group.id, name)} />
        </div>
      )}

      {/* 科室管理（进入某科室后显示重命名/删除） */}
      {section && group.kind === "dept" && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-hairline bg-surface px-4 py-3">
          <Chip tone="outline">{group.name}</Chip>
          {editing === section.id ? (
            <input
              autoFocus
              defaultValue={section.name}
              onBlur={(e) => { const v = e.target.value.trim(); if (v) renameSection(group.id, section.id, v); setEditing(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(null); }}
              className={cn(btn({ variant: "outline", size: "sm" }), "w-40")}
            />
          ) : (
            <button onClick={() => setEditing(section.id)} className="text-[13px] font-bold text-foreground underline-offset-4 hover:underline">
              {section.name}
            </button>
          )}
          <span className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { if (window.confirm(`删除科室「${section.name}」？该科室下的应用会保留但失去科室归属。`)) { removeSection(group.id, section.id); } }}
              className={btn({ variant: "danger", size: "sm" })}
            >
              删除科室
            </button>
            <Link to="/dept/$deptId" params={{ deptId: group.id }} className={btn({ variant: "ghost", size: "sm" })}>返回部门</Link>
          </span>
        </div>
      )}

      {list.length ? (
        <>
          <SectionLabel title={section ? `${section.name}的应用` : "全部应用"} count={list.length} />
          <AppGrid apps={list} cols="2 sm:grid-cols-3 xl:grid-cols-4" />
        </>
      ) : (
        <EmptyState
          title={section ? `${section.name}还没有应用` : `${group.name}还没有应用`}
          desc="把这台服务器上跑着的内部系统登记进来，同事就能在这里找到它。"
          action={
            <button onClick={() => openNew({ presetGroup: group.id, presetSection: section?.id ?? group.sections[0]?.id })} className={btn({ variant: "outline", size: "sm" })}>
              <Plus size={13} />新增应用
            </button>
          }
        />
      )}
    </div>
  );
}

function AddSectionBtn({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={btn({ variant: "ghost", size: "sm" })}>
        <Plus size={12} />添加科室
      </button>
    );
  }
  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      placeholder="科室名称，回车确认"
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && val.trim()) { onAdd(val.trim()); setVal(""); setOpen(false); }
        if (e.key === "Escape") setOpen(false);
      }}
      className={cn(
        "h-7 w-44 rounded-md border border-border bg-card px-2 text-[12.5px] text-foreground outline-none placeholder:text-subtle focus:border-accent",
      )}
    />
  );
}
