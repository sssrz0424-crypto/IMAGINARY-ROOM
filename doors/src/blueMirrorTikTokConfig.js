/**
 * 五面镜 TikTok 假 UI 文案与计数（改这里即可换内容，不必改 UI 代码）。
 */
export const MIRROR_TIKTOK_CONFIG = [
  {
    username: "@stage1_girl",
    dateLabel: "1-28",
    caption: "第一次写代码的夜晚 #毕业设计 #coding",
    likes: 6724,
    comments: 354,
    saves: 54,
    stageNeedle: "stage 1",
  },
  {
    username: "@stage2_worker",
    dateLabel: "3-15",
    caption: "实习第一天 #打工人 #职场",
    likes: 12800,
    comments: 892,
    saves: 210,
    stageNeedle: "stage 2",
  },
  {
    username: "@stage3_grad",
    dateLabel: "6-20",
    caption: "终于毕业了！！！ #毕业快乐 #学位服",
    likes: 45200,
    comments: 3201,
    saves: 880,
    stageNeedle: "stage 3",
  },
  {
    username: "@stage4_speaker",
    dateLabel: "9-08",
    caption: "上台前手还在抖 #pre #publicspeaking",
    likes: 9100,
    comments: 567,
    saves: 143,
    stageNeedle: "stage 4",
  },
  {
    username: "@stage5_gala",
    dateLabel: "12-31",
    caption: "晚宴这身还行吧 #年会 #礼服",
    likes: 88300,
    comments: 4102,
    saves: 1900,
    stageNeedle: "stage 5",
  },
];

export function formatTikTokCount(n) {
  const v = Math.max(0, Math.round(Number(n) || 0));
  if (v >= 10000) return `${(v / 10000).toFixed(1).replace(/\.0$/, "")}w`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(v);
}
