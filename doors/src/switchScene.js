import { showGreenDoorVoidScene } from "./greenDoorVoidScene.js";
import { showWhiteDoorGalleryScene } from "./whiteDoorGalleryScene.js";
import { showRedDoorBehindScene } from "./redDoorBehindScene.js";
import { showBlueDoorVoidScene } from "./blueDoorVoidScene.js";
import { showMintDoorGreenscreenScene } from "./mintDoorGreenscreenScene.js";
import { showPurpleDoorBehindScene } from "./purpleDoorBehindScene.js";
import { showPinkDoorBehindScene } from "./pinkDoorBehindScene.js";
import { showYellowDoorScene } from "./yellowDoorScene.js";
import { showCoralDoorBehindScene } from "./coralDoorBehindScene.js";

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
      showGreenDoorVoidScene();
      break;
    case 2:
      showWhiteDoorGalleryScene();
      break;
    case 3:
      showYellowDoorScene();
      break;
    case 4:
      showPinkDoorBehindScene();
      break;
    case 5:
      showMintDoorGreenscreenScene();
      break;
    case 6:
      showCoralDoorBehindScene();
      break;
    case 7:
      showPurpleDoorBehindScene();
      break;
    case 8:
      showBlueDoorVoidScene();
      break;
    case 9:
      showRedDoorBehindScene();
      break;
    default:
      console.warn("[switchScene] 未知 doorId", doorId);
  }
}
