/**
 * 九扇门 → 不同场景入口（占位）。后续在各 case 里挂载你的场景内容。
 * doorId：1–9，与 DOOR_LABEL_TO_ID 一致。
 */
export const DOOR_LABEL_TO_ID = {
  green: 1,
  white: 2,
  yellow: 3,
  pink: 4,
  teal: 5,
  orange: 6,
  purple: 7,
  blue: 8,
  red: 9,
};

/** 可选：与 doorId 对应的路由路径或场景 key，便于接路由 */
export const DOOR_SCENE_PATH = {
  1: "/scene/a",
  2: "/scene/b",
  3: "/scene/c",
  4: "/scene/d",
  5: "/scene/e",
  6: "/scene/f",
  7: "/scene/g",
  8: "/scene/h",
  9: "/scene/i",
};

export function switchScene(doorId) {
  const path = DOOR_SCENE_PATH[doorId] ?? "?";
  console.log("[switchScene] 门 → 场景（占位）", { doorId, path });

  switch (doorId) {
    case 1:
      break;
    case 2:
      break;
    case 3:
      break;
    case 4:
      break;
    case 5:
      break;
    case 6:
      break;
    case 7:
      break;
    case 8:
      break;
    case 9:
      break;
    default:
      console.warn("[switchScene] 未知 doorId", doorId);
  }
}
