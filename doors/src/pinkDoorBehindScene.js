/**
 * 粉门（doorId 4，label pink）后：粉色线框空间 + 九张贴图透视贴合三面墙。
 * 正墙 5 张（4·3·8·6·5）｜左墙 2 张（2、1）｜右墙 2 张（7、9）。
 */
import {
  applyPinkPosterLayoutToDom,
  getPinkPosterLayoutState,
} from "./pinkDoorPosterLayoutPanel.js";

const BODY_CLASS = "doors-ui--pink-scene";
const OPEN_CLASS = "pink-door-scene--open";
const EXIT_VISIBLE_CLASS = "pink-door-scene-exit--visible";

import { publicUrl } from "./publicUrl.js";

const BG_URL_FALLBACK = publicUrl("pink_door_scene/background.png");
const POSTER_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const pinkAssetModules = import.meta.glob("../assets/pink_door_scene/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function findPinkAssetUrl(filename) {
  const n = filename.toLowerCase();
  const hit = Object.keys(pinkAssetModules).find((key) =>
    key.replaceAll("\\", "/").toLowerCase().endsWith(`/${n}`)
  );
  return hit ? pinkAssetModules[hit] : null;
}

function resolveBackgroundUrl() {
  const named = findPinkAssetUrl("background.png");
  if (named) return named;
  const hit = Object.keys(pinkAssetModules).find((k) =>
    k.replaceAll("\\", "/").toLowerCase().includes("background")
  );
  return hit ? pinkAssetModules[hit] : BG_URL_FALLBACK;
}

function resolvePosterUrl(id) {
  return findPinkAssetUrl(`${id}.png`) ?? `/pink_door_scene/${id}.png`;
}

const BACKGROUND_URL = resolveBackgroundUrl();
const POSTER_URLS = Object.fromEntries(POSTER_IDS.map((id) => [id, resolvePosterUrl(id)]));

let mounted = false;
let rootEl = null;
let exitBtn = null;
let stageEl = null;
let roomEl = null;

function getCanvas() {
  return document.querySelector("#app");
}

function isOpen() {
  return Boolean(rootEl?.classList.contains(OPEN_CLASS));
}

function hide() {
  rootEl?.classList.remove(OPEN_CLASS);
  exitBtn?.classList.remove(EXIT_VISIBLE_CLASS);
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
  document.querySelector("#scene-fade")?.classList.remove("scene-fade--visible");
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

function applyBgSrc() {
  if (!stageEl) return;
  const u = BACKGROUND_URL.replace(/\\/g, "/");
  stageEl.style.backgroundImage = `url("${u}")`;
}

function assignPosterSources() {
  if (!roomEl) return;
  for (const id of POSTER_IDS) {
    const slot = roomEl.querySelector(`[data-poster-id="${id}"]`);
    const img = slot?.querySelector(".pink-door-scene__poster-img");
    if (img) {
      img.src = POSTER_URLS[id] ?? "";
    }
  }
}

function refreshDomRefs() {
  rootEl = document.getElementById("pink-door-scene-root");
  exitBtn = document.getElementById("pink-door-scene-exit");
  stageEl = rootEl?.querySelector(".pink-door-scene__stage") ?? null;
  roomEl = rootEl?.querySelector(".pink-door-scene__room") ?? null;
}

export function mountPinkDoorBehindScene() {
  if (mounted) return;
  refreshDomRefs();
  if (!rootEl || !exitBtn || !stageEl || !roomEl) {
    console.warn("[pinkDoorBehindScene] 缺少 DOM", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
      stageEl: Boolean(stageEl),
      roomEl: Boolean(roomEl),
    });
    return;
  }

  rootEl.classList.remove(OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;
  applyBgSrc();
  assignPosterSources();
  applyPinkPosterLayoutToDom(getPinkPosterLayoutState());

  exitBtn.addEventListener("click", onExitActivate, true);
  exitBtn.addEventListener("pointerup", onExitActivate, true);
  window.addEventListener("keydown", onKeydown, true);

  mounted = true;
}

export function showPinkDoorBehindScene() {
  if (!mounted) {
    mountPinkDoorBehindScene();
  }
  refreshDomRefs();
  if (!rootEl || !exitBtn || !stageEl || !roomEl) return;

  applyBgSrc();
  assignPosterSources();
  applyPinkPosterLayoutToDom(getPinkPosterLayoutState());

  rootEl.hidden = false;
  rootEl.classList.add(OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";
}
