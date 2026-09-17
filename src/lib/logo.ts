/**
 * 站点 logo：优先走 favicon 聚合服务自动取图，取不到由 AppGlyph 回退首字。
 * 内网 IP 一律不请求外部服务（既拿不到也避免向内暴露内网地址）。
 */

/** 从 url 提取主机名；非法或纯 IP 返回 null */
export function hostOf(url: string): string | null {
  try {
    const h = new URL(url).hostname;
    if (!h || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return null;
    return h;
  } catch {
    return null;
  }
}

/** 候选 logo 地址（按顺序尝试）；内网/无域名应用返回空数组 */
export function logoCandidates(url: string): string[] {
  const host = hostOf(url);
  if (!host) return [];
  const root = host.split(".").slice(-2).join(".");
  return [
    // 首选两家聚合服务（返回高清 PNG、覆盖率高），再兜底同域/其他源
    `https://icon.horse/icon/${host}`,
    `https://unavatar.io/${host}`,
    `https://unavatar.io/${root}`,
    `https://${host}/favicon.ico`,
    `https://favicon.im/${host}?larger=true`,
  ];
}

/** 候选图并发探测超时（毫秒）：超过即判定该源失败，推进下一候选 */
export const PROBE_TIMEOUT = 1500;

const AVATAR_NS = "ebara-workbench:avatars:v1";

/** 用户手动上传/指定的 logo 数据地址（data URL），按应用 id 存 localStorage */
export function readAvatarOverride(appId?: string): string | null {
  if (!appId) return null;
  try {
    const map = JSON.parse(localStorage.getItem(AVATAR_NS) ?? "{}");
    return typeof map[appId] === "string" ? map[appId] : null;
  } catch {
    return null;
  }
}

export function writeAvatarOverride(appId: string, dataUrl: string | null) {
  try {
    const map = JSON.parse(localStorage.getItem(AVATAR_NS) ?? "{}");
    if (dataUrl) map[appId] = dataUrl;
    else delete map[appId];
    localStorage.setItem(AVATAR_NS, JSON.stringify(map));
  } catch {
    /* 存储满时静默失败 */
  }
}
