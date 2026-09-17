import type { GlyphColor, GroupTone } from "@/lib/types";

/**
 * 马卡龙柔彩色板：以应用字形色为键，供分组标签、分节标题、统计条共用。
 * 全部走 token utility，不在组件里散落色值。
 */
export const GROUP_TONES: Record<GlyphColor, GroupTone> = {
  grape: { text: "text-t-grape", bg: "bg-t-grape", soft: "bg-t-grape/12", dot: "bg-t-grape" },
  sky: { text: "text-t-sky", bg: "bg-t-sky", soft: "bg-t-sky/12", dot: "bg-t-sky" },
  mint: { text: "text-t-mint", bg: "bg-t-mint", soft: "bg-t-mint/14", dot: "bg-t-mint" },
  peach: { text: "text-t-peach", bg: "bg-t-peach", soft: "bg-t-peach/14", dot: "bg-t-peach" },
  rose: { text: "text-t-rose", bg: "bg-t-rose", soft: "bg-t-rose/14", dot: "bg-t-rose" },
  sea: { text: "text-t-sea", bg: "bg-t-sea", soft: "bg-t-sea/12", dot: "bg-t-sea" },
  ink: { text: "text-muted-foreground", bg: "bg-subtle", soft: "bg-surface", dot: "bg-subtle" },
};

/** 分组 id → 字形色；未登记的分组按序号轮转取色，保证新增部门也有颜色 */
const GROUP_COLOR: Record<string, GlyphColor> = {
  "g-platform": "grape",
  "g-ai": "sky",
  "g-tools": "mint",
  "g-docs": "peach",
  "dept-dev": "sea",
  "dept-prod": "rose",
  "dept-tech": "grape",
};

const CYCLE: GlyphColor[] = ["grape", "sky", "mint", "peach", "rose", "sea"];

export function groupColorOf(groupId: string, index = 0): GlyphColor {
  return GROUP_COLOR[groupId] ?? CYCLE[index % CYCLE.length];
}

export function toneOf(color: GlyphColor): GroupTone {
  return GROUP_TONES[color] ?? GROUP_TONES.ink;
}
