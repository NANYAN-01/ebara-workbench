import type { GlyphColor, OrgGroup, WorkApp } from "./types";

/** 研发中心组织架构（部 → 科）+ 跨部门公共分组 */
export const SEED_GROUPS: OrgGroup[] = [
  {
    id: "dept-dev",
    name: "开发部",
    kind: "dept",
    order: 1,
    sections: [{ id: "sec-dev", name: "开发科" }],
  },
  {
    id: "dept-prod",
    name: "产品研发部",
    kind: "dept",
    order: 2,
    sections: [
      { id: "sec-prod1", name: "产品研发一科" },
      { id: "sec-prod2", name: "产品研发二科" },
    ],
  },
  {
    id: "dept-tech",
    name: "技术研发部",
    kind: "dept",
    order: 3,
    sections: [
      { id: "sec-eng", name: "工程技术研发科" },
      { id: "sec-elec", name: "电气技术研发科" },
    ],
  },
  {
    id: "g-platform",
    name: "公司平台",
    kind: "group",
    desc: "全员每天都要打开的管理系统",
    order: 4,
    sections: [],
  },
  {
    id: "g-ai",
    name: "AI 助手",
    kind: "group",
    desc: "写材料、读文档、查代码的对话工具",
    order: 5,
    sections: [],
  },
  {
    id: "g-tools",
    name: "效率工具",
    kind: "group",
    desc: "PDF、图片、编码、时间戳等日常小工具站",
    order: 6,
    sections: [],
  },
  {
    id: "g-docs",
    name: "文档与社区",
    kind: "group",
    desc: "手册、问答与知识库",
    order: 7,
    sections: [],
  },
];

type Draft = Omit<WorkApp, "createdAt" | "updatedAt">;

const T0 = Date.UTC(2026, 0, 1);

function app(d: Draft): WorkApp {
  return { ...d, createdAt: T0, updatedAt: T0 };
}

let seq = 0;
const nid = () => `seed-${(++seq).toString().padStart(3, "0")}`;

interface Spec {
  name: string;
  url?: string;
  groupId: string;
  sectionId?: string | null;
  type: WorkApp["type"];
  glyph: string;
  tone?: string;
  note?: string;
  tags?: string[];
  owner?: string;
  host?: string;
  port?: string;
  path?: string;
}

/** 旧分组 id → 新分组 id（公共分组统一为 g-* 前缀） */
const GROUP_ALIAS: Record<string, string> = {
  "pub-platform": "g-platform",
  "pub-ai": "g-ai",
  "pub-tools": "g-tools",
  "pub-knowledge": "g-docs",
};

/** 旧色调名 → 新柔彩色调，保证历史数据与旧导出配置导入后仍能落到有效色上 */
const TONE_ALIAS: Record<string, GlyphColor> = {
  energy: "peach",
  primary: "grape",
  steel: "sky",
  ok: "mint",
  warn: "rose",
  off: "sea",
  ink: "ink",
  grape: "grape",
  sky: "sky",
  mint: "mint",
  peach: "peach",
  rose: "rose",
  sea: "sea",
  slate: "sky",
  amber: "peach",
  moss: "mint",
  rust: "rose",
};

function build(s: Spec): WorkApp {
  const url =
    s.url ??
    (s.host
      ? `http://${s.host}${s.port ? `:${s.port}` : ""}${s.path ?? ""}`
      : "");
  return app({
    id: nid(),
    name: s.name,
    url,
    groupId: GROUP_ALIAS[s.groupId] ?? s.groupId,
    sectionId: s.sectionId ?? "",
    type: s.type,
    status: "active",
    owner: s.owner,
    desc: s.note,
    tags: s.tags ?? [],
    glyph: TONE_ALIAS[s.tone ?? "ink"] ?? "ink",
    intranet: Boolean(s.host) || /^https?:\/\/(192\.168\.|10\.)/.test(url),
    enabled: true,
    host: s.host,
    port: s.port,
    path: s.path,
  });
}

export const SEED_APPS: WorkApp[] = [
  /* ---------- 公司平台 ---------- */
  build({
    name: "U9 管理系统",
    url: "http://192.168.1.6/erp/mvc/login/index?ReturnUrl=%2Ferp%2Fmvc%2Fmain%2Findex",
    groupId: "pub-platform",
    type: "platform",
    glyph: "U9",
    tone: "grape",
    note: "用友 U9 ERP，生产/采购/库存/财务一体化",
    tags: ["ERP", "内网", "高频"],
    host: "192.168.1.6",
    path: "/erp/mvc/login/index",
  }),
  build({
    name: "OA 办公系统",
    url: "http://192.168.1.18/",
    groupId: "pub-platform",
    type: "platform",
    glyph: "OA",
    tone: "grape",
    note: "流程审批、公告通知、考勤请假",
    tags: ["审批", "内网", "高频"],
    host: "192.168.1.18",
  }),
  build({
    name: "邮件系统",
    url: "http://192.168.1.18/mail/",
    groupId: "pub-platform",
    type: "platform",
    glyph: "邮",
    tone: "sky",
    note: "企业邮箱 Webmail（示例地址，请按实际修改）",
    tags: ["内网", "示例"],
    host: "192.168.1.18",
    path: "/mail/",
  }),

  /* ---------- AI 助手 ---------- */
  build({
    name: "豆包",
    url: "https://www.doubao.com/",
    groupId: "pub-ai",
    type: "external",
    glyph: "豆",
    tone: "grape",
    note: "字节跳动 AI 对话，适合文案与日常问答",
    tags: ["AI", "对话"],
  }),
  build({
    name: "通义千问",
    url: "https://www.qianwen.com/",
    groupId: "pub-ai",
    type: "external",
    glyph: "千",
    tone: "sky",
    note: "阿里通义，长文本与代码能力较强",
    tags: ["AI", "对话", "代码"],
  }),
  build({
    name: "Kimi",
    url: "https://kimi.moonshot.cn/",
    groupId: "pub-ai",
    type: "external",
    glyph: "K",
    tone: "mint",
    note: "月之暗面，超长上下文、读文档好用",
    tags: ["AI", "长文档"],
  }),
  build({
    name: "DeepSeek",
    url: "https://chat.deepseek.com/",
    groupId: "pub-ai",
    type: "external",
    glyph: "D",
    tone: "peach",
    note: "推理与编程能力强，免费额度充足",
    tags: ["AI", "代码", "推理"],
  }),
  build({
    name: "智谱清言",
    url: "https://chatglm.cn/",
    groupId: "pub-ai",
    type: "external",
    glyph: "清",
    tone: "rose",
    note: "GLM 系列，支持智能体与画图",
    tags: ["AI", "智能体"],
  }),
  build({
    name: "腾讯元宝",
    url: "https://yuanbao.tencent.com/",
    groupId: "pub-ai",
    type: "external",
    glyph: "元",
    tone: "sea",
    note: "混元模型，微信公众号内容检索方便",
    tags: ["AI"],
  }),

  /* ---------- 效率工具：PDF / 图片 / 开发 ---------- */
  build({
    name: "iLovePDF",
    url: "https://www.ilovepdf.com/zh-cn",
    groupId: "pub-tools",
    type: "external",
    glyph: "P",
    tone: "peach",
    note: "PDF 合并 / 拆分 / 压缩 / 转 Word 全都有",
    tags: ["PDF", "转换"],
  }),
  build({
    name: "PDF24 Tools",
    url: "https://tools.pdf24.org/zh/",
    groupId: "pub-tools",
    type: "external",
    glyph: "24",
    tone: "peach",
    note: "完全免费的 PDF 工具箱，无次数限制",
    tags: ["PDF", "免费"],
  }),
  build({
    name: "Smallpdf",
    url: "https://smallpdf.com/cn",
    groupId: "pub-tools",
    type: "external",
    glyph: "S",
    tone: "peach",
    note: "界面简洁的 PDF 编辑与压缩",
    tags: ["PDF"],
  }),
  build({
    name: "Convertio",
    url: "https://convertio.co/zh/",
    groupId: "pub-tools",
    type: "external",
    glyph: "C",
    tone: "sky",
    note: "万能格式转换：文档 / 图片 / 音视频",
    tags: ["转换", "格式"],
  }),
  build({
    name: "TinyPNG",
    url: "https://tinypng.com/",
    groupId: "pub-tools",
    type: "external",
    glyph: "T",
    tone: "mint",
    note: "PNG/JPG 有损压缩，批量拖拽",
    tags: ["图片", "压缩"],
  }),
  build({
    name: "Squoosh",
    url: "https://squoosh.app/",
    groupId: "pub-tools",
    type: "external",
    glyph: "Q",
    tone: "mint",
    note: "Google 出品的图片编码对比工具",
    tags: ["图片"],
  }),
  build({
    name: "remove.bg",
    url: "https://www.remove.bg/zh",
    groupId: "pub-tools",
    type: "external",
    glyph: "R",
    tone: "mint",
    note: "一键抠图去背景",
    tags: ["图片", "抠图"],
  }),
  build({
    name: "Iconify 图标库",
    url: "https://icon-sets.iconify.design/",
    groupId: "pub-tools",
    type: "external",
    glyph: "I",
    tone: "sky",
    note: "20 万+ 开源图标统一检索下载",
    tags: ["图标", "前端"],
  }),
  build({
    name: "Excalidraw",
    url: "https://excalidraw.com/",
    groupId: "pub-tools",
    type: "external",
    glyph: "E",
    tone: "sky",
    note: "手绘风白板，画流程图 / 方案草图",
    tags: ["画图", "流程图"],
  }),
  build({
    name: "JSON 中文工具站",
    url: "https://www.json.cn/",
    groupId: "pub-tools",
    type: "external",
    glyph: "{ }",
    tone: "sea",
    note: "JSON 校验、格式化、路径树",
    tags: ["JSON", "调试"],
  }),
  build({
    name: "Regex101",
    url: "https://regex101.com/",
    groupId: "pub-tools",
    type: "external",
    glyph: ".*",
    tone: "sea",
    note: "正则表达式实时测试与解释",
    tags: ["正则", "调试"],
  }),
  build({
    name: "CyberChef",
    url: "https://gchq.github.io/CyberChef/",
    groupId: "pub-tools",
    type: "external",
    glyph: "编",
    tone: "sea",
    note: "Base64 / URL / 哈希 / 加解密瑞士军刀",
    tags: ["编码", "加密"],
  }),
  build({
    name: "时间戳转换",
    url: "https://www.tool.lu/timestamp",
    groupId: "pub-tools",
    type: "external",
    glyph: "时",
    tone: "sky",
    note: "Unix 时间戳 ↔ 日期互转",
    tags: ["时间戳", "调试"],
  }),
  build({
    name: "QuickChart",
    url: "https://quickchart.io/",
    groupId: "pub-tools",
    type: "external",
    glyph: "📊",
    tone: "sea",
    note: "生成图表图片，贴报告 / 群里发图用",
    tags: ["图表"],
  }),
  build({
    name: "Can I Use",
    url: "https://caniuse.com/",
    groupId: "pub-tools",
    type: "external",
    glyph: "?",
    tone: "sky",
    note: "浏览器特性兼容性查询",
    tags: ["前端", "兼容"],
  }),

  /* ---------- 文档与社区 ---------- */
  build({
    name: "语雀",
    url: "https://www.yuque.com/",
    groupId: "pub-knowledge",
    type: "external",
    glyph: "雀",
    tone: "peach",
    note: "知识库与需求文档协作",
    tags: ["文档", "知识库"],
  }),
  build({
    name: "MDN Web Docs",
    url: "https://developer.mozilla.org/zh-CN/",
    groupId: "pub-knowledge",
    type: "external",
    glyph: "M",
    tone: "sea",
    note: "Web 标准权威手册",
    tags: ["文档", "前端"],
  }),
  build({
    name: "Stack Overflow",
    url: "https://stackoverflow.com/",
    groupId: "pub-knowledge",
    type: "external",
    glyph: "SO",
    tone: "peach",
    note: "报错先搜这里，八成有人遇过",
    tags: ["问答", "排错"],
  }),
  build({
    name: "GitHub",
    url: "https://github.com/",
    groupId: "pub-knowledge",
    type: "external",
    glyph: "G",
    tone: "grape",
    note: "开源仓库与依赖源码查阅",
    tags: ["代码托管"],
  }),
  build({
    name: "菜鸟教程",
    url: "https://www.runoob.com/",
    groupId: "pub-knowledge",
    type: "external",
    glyph: "菜",
    tone: "mint",
    note: "入门语法速查，中文友好",
    tags: ["教程"],
  }),
  build({
    name: "百度翻译",
    url: "https://fanyi.baidu.com/",
    groupId: "pub-knowledge",
    type: "external",
    glyph: "译",
    tone: "sky",
    note: "术语与说明书段落翻译",
    tags: ["翻译"],
  }),

  /* ---------- 各部门内部服务（示例，请改成真实端口） ---------- */
  build({
    name: "项目任务看板",
    groupId: "dept-dev",
    sectionId: "sec-dev",
    type: "internal",
    glyph: "看",
    tone: "mint",
    host: "192.168.1.30",
    port: "3000",
    note: "示例记录：开发科自研任务管理，请修改为真实地址",
    tags: ["示例", "管理"],
    owner: "开发科",
  }),
  build({
    name: "接口文档平台",
    groupId: "dept-dev",
    sectionId: "sec-dev",
    type: "internal",
    glyph: "API",
    tone: "sea",
    host: "192.168.1.30",
    port: "8081",
    note: "示例记录：Swagger / Apifox 自建服务",
    tags: ["示例", "文档"],
    owner: "开发科",
  }),
  build({
    name: "代码审查服务",
    groupId: "dept-dev",
    sectionId: "sec-dev",
    type: "internal",
    glyph: "CR",
    tone: "sky",
    host: "192.168.1.31",
    port: "8929",
    note: "示例记录：Gitea / GitLab 内网实例",
    tags: ["示例", "代码"],
    owner: "开发科",
  }),
  build({
    name: "选型参数库",
    groupId: "dept-prod",
    sectionId: "sec-prod1",
    type: "internal",
    glyph: "选",
    tone: "rose",
    host: "192.168.1.40",
    port: "5000",
    note: "示例记录：水泵选型参数与计算",
    tags: ["示例", "产品"],
    owner: "产品研发一科",
  }),
  build({
    name: "BOM 清单工具",
    groupId: "dept-prod",
    sectionId: "sec-prod2",
    type: "internal",
    glyph: "BOM",
    tone: "peach",
    host: "192.168.1.41",
    port: "8000",
    note: "示例记录：产品结构清单维护",
    tags: ["示例", "BOM"],
    owner: "产品研发二科",
  }),
  build({
    name: "DrawReview AI Agent V12",
    groupId: "dept-tech",
    sectionId: "",
    type: "internal",
    glyph: "试",
    tone: "grape",
    host: "172.16.2.211",
    port: "8000",
    note: "工程设计图纸审查平台",
    tags: ["示例", "试验"],
    owner: "工程技术部",
  }),
  build({
    name: "电气图纸归档",
    groupId: "dept-tech",
    sectionId: "sec-elec",
    type: "internal",
    glyph: "图",
    tone: "sea",
    host: "192.168.1.51",
    port: "8090",
    note: "示例记录：电气原理图版本管理",
    tags: ["示例", "图纸"],
    owner: "电气技术研发科",
  }),
];

export const DEFAULT_FAVORITES: string[] = SEED_APPS.filter((a) =>
  ["豆包", "DeepSeek", "DrawReview AI Agent V12", "iLovePDF"].includes(a.name),
).map((a) => a.id);
