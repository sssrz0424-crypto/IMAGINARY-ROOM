/**
 * 红门（doorId 9）打开后的场景：舞台背景 + 人物 + 前景观众（分 PNG 叠层）。
 * 在红门场景内双击任意处：观众举手机拍照图 + 同步音效；再次双击恢复。
 */
import { publicUrl } from "./publicUrl.js";

const BODY_CLASS = "doors-ui--red-scene";
const OPEN_CLASS = "red-door-scene--open";
const EXIT_VISIBLE_CLASS = "red-door-scene--exit-visible";

const CROWD_CAMERA_SOUND_URL = publicUrl("red_door_scene/crowds_camera_flashes.wav");

const LAYERS_PHOTO_CLASS = "red-door-scene__layers--audience-photo";

let mounted = false;
let rootEl = null;
let exitBtn = null;
let layersEl = null;
let audiencePhotoActive = false;
let dblClickBound = false;

function getCanvas() {
  return document.querySelector("#app");
}

function isOpen() {
  return Boolean(rootEl?.classList.contains(OPEN_CLASS));
}

function resetAudiencePhotoLayer() {
  audiencePhotoActive = false;
  layersEl?.classList.remove(LAYERS_PHOTO_CLASS);
}

function playCrowdCameraSound() {
  try {
    const a = new Audio(CROWD_CAMERA_SOUND_URL);
    a.volume = 0.88;
    void a.play();
  } catch {
    /* ignore */
  }
}

function onSceneRootDblClick(e) {
  if (!isOpen()) return;
  if (!rootEl?.contains(e.target)) return;
  e.preventDefault();
  audiencePhotoActive = !audiencePhotoActive;
  if (layersEl) {
    layersEl.classList.toggle(LAYERS_PHOTO_CLASS, audiencePhotoActive);
  }
  if (audiencePhotoActive) {
    playCrowdCameraSound();
  }
}

function hide() {
  rootEl?.classList.remove(OPEN_CLASS);
  exitBtn?.classList.remove(EXIT_VISIBLE_CLASS);
  resetAudiencePhotoLayer();
  if (rootEl) {
    rootEl.hidden = true;
    rootEl.setAttribute("aria-hidden", "true");
  }
  if (exitBtn) {
    exitBtn.hidden = true;
  }
  document.body.classList.remove(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) {
    canvas.style.pointerEvents = "";
    canvas.style.visibility = "";
  }
  const fade = document.querySelector("#scene-fade");
  fade?.classList.remove("scene-fade--visible");
}

function onExitActivate(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!isOpen()) return;
  hide();
}

function onKeydown(e) {
  if (e.key === "Escape" && isOpen()) {
    e.preventDefault();
    hide();
  }
}

export function mountRedDoorBehindScene() {
  if (mounted) return;
  rootEl = document.getElementById("red-door-scene-root");
  exitBtn = document.getElementById("red-door-scene-exit");
  if (!rootEl || !exitBtn) {
    console.warn("[redDoorBehindScene] 缺少 DOM：根节点或返回按钮", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
    });
    return;
  }

  rootEl.classList.remove(OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;

  exitBtn.addEventListener("click", onExitActivate, true);
  exitBtn.addEventListener("pointerup", onExitActivate, true);
  window.addEventListener("keydown", onKeydown, true);

  layersEl = rootEl.querySelector(".red-door-scene__layers");
  if (layersEl && !dblClickBound) {
    rootEl.addEventListener("dblclick", onSceneRootDblClick);
    dblClickBound = true;
  }

  mounted = true;
}

export function showRedDoorBehindScene() {
  if (!mounted) {
    mountRedDoorBehindScene();
  }
  if (!rootEl) rootEl = document.getElementById("red-door-scene-root");
  if (!exitBtn) exitBtn = document.getElementById("red-door-scene-exit");
  if (!rootEl || !exitBtn) return;
  if (!layersEl) layersEl = rootEl.querySelector(".red-door-scene__layers");

  rootEl.hidden = false;
  rootEl.classList.add(OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";

  resetAudiencePhotoLayer();
}
