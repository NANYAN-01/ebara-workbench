import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { logoCandidates, readAvatarOverride, PROBE_TIMEOUT } from "@/lib/logo";
import type { GlyphColor } from "@/lib/types";

const TONE: Record<GlyphColor, string> = {
  ink: "bg-surface text-muted-foreground border-hairline",
  grape: "bg-t-grape/12 text-t-grape border-t-grape/20",
  sky: "bg-t-sky/12 text-t-sky border-t-sky/20",
  mint: "bg-t-mint/14 text-t-mint border-t-mint/22",
  peach: "bg-t-peach/14 text-t-peach border-t-peach/22",
  rose: "bg-t-rose/14 text-t-rose border-t-rose/22",
  sea: "bg-t-sea/12 text-t-sea border-t-sea/20",
};

/**
 * 应用铭牌：优先加载站点真实 favicon，任一候选失败或超时则推进下一候选，
 * 全部拿不到时回退「首字」色板铭牌。logo 命中后直接铺满显示（无方框衬底），
 * 探测层隐藏加载，因此 pending / 403 / 透明图都不会出现空白块。
 */
export function AppGlyph({
  name,
  url,
  appId,
  color = "ink",
  size = "md",
  className,
}: {
  name: string;
  url?: string;
  appId?: string;
  color?: GlyphColor;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "h-8 w-8 text-[12px]", md: "h-9 w-9 text-[13px]", lg: "h-11 w-11 text-[15px]" }[size];

  // 手动上传的 logo 优先于自动抓取
  const override = readAvatarOverride(appId);
  const candidates = override ? [override] : url ? logoCandidates(url, name) : [];
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIdx(0);
    setLoaded(false);
  }, [url, appId]);

  // 超时保护：候选图迟迟不 onLoad（如外网被挂起），推进下一候选；全部耗尽后回退首字
  useEffect(() => {
    if (loaded || idx >= candidates.length) return;
    const t = setTimeout(() => {
      console.warn("[AppGlyph] logo 候选加载超时，降级下一个:", name, candidates[idx]);
      setIdx((i) => i + 1);
    }, override ? 8000 : PROBE_TIMEOUT);
    return () => clearTimeout(t);
  }, [idx, loaded, url, appId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 全部候选耗尽后，隔一段时间再重试一轮（外链服务可能只是暂时抽风）
  useEffect(() => {
    if (!candidates.length || idx < candidates.length) return;
    const t = setTimeout(() => {
      console.info("[AppGlyph] 全部 logo 候选失败，稍后重试:", name, url);
      setIdx(0);
      setLoaded(false);
    }, 20000);
    return () => clearTimeout(t);
  }, [idx, loaded, url, appId]); // eslint-disable-line react-hooks/exhaustive-deps

  const showLogo = loaded && idx < candidates.length;

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border font-medium tracking-tight transition-colors",
        dims,
        TONE[color] ?? TONE.ink,
        className,
      )}
    >
      {/* 探测层：隐藏加载，成功后才露出 logo，失败/超时推进下一候选 */}
      {!showLogo && idx < candidates.length && (
        <img
          key={candidates[idx]}
          src={candidates[idx]}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          onLoad={(e) => {
            // 部分源对无图标站点返回 1x1 占位图或 HTML 页（解码后尺寸为 0），均按失败处理
            const img = e.currentTarget;
            if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
              console.warn("[AppGlyph] logo 无效（占位/非图片），降级下一个:", name, candidates[idx]);
              setIdx((i) => i + 1);
            } else {
              setLoaded(true);
            }
          }}
          onError={() => {
            console.warn("[AppGlyph] logo 候选加载失败，降级下一个:", name, candidates[idx]);
            setIdx((i) => i + 1);
          }}
        />
      )}
      {/* logo 命中后直接铺满铭牌显示，不再套方框 */}
      {showLogo ? (
        <img src={candidates[idx]} alt="" className="h-full w-full bg-transparent object-contain p-0.5" onError={() => setLoaded(false)} />
      ) : (
        (name.trim()[0] ?? "?").toUpperCase()
      )}
    </span>
  );
}
