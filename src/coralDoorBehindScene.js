/**
 * 西柚色门（doorId 6，label orange，贴图 door_coral）后：
 * 进入为全屏背景 → 再双击手机框替代鼠标 → 再双击画面中央出现双子素材。
 */
const BODY_CLASS = "doors-ui--coral-scene";
const OPEN_CLASS = "coral-door-scene--open";
const EXIT_VISIBLE_CLASS = "coral-door-scene-exit--visible";
/** 手机框替代系统光标（隐藏鼠标） */
const PHONE_CURSOR_CLASS = "coral-door-scene--phone-cursor";

const BG_URL_FALLBACK = "/coral_door_scene/background/background.png";
const PHONE_FRAME_URL_FALLBACK = "/coral_door_scene/phone_frame/phone_frame_mask.png";
const TWINS_URL_FALLBACK = "/coral_door_scene/双子.png";

const coralAssetModules = import.meta.glob("../assets/coral_door_scene/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function findCoralAssetUrl(filename) {
  const n = filename.toLowerCase();
  const hit = Object.keys(coralAssetModules).find((key) =>
    key.replaceAll("\\", "/").toLowerCase().endsWith(`/${n}`)
  );
  return hit ? coralAssetModules[hit] : null;
}

function findCoralAssetUrlByNeedle(needle) {
  const n = needle.toLowerCase();
  const hit = Object.keys(coralAssetModules).find((key) =>
    key.replaceAll("\\", "/").toLowerCase().includes(n)
  );
  return hit ? coralAssetModules[hit] : null;
}

function resolveBackgroundUrl() {
  const named =
    findCoralAssetUrl("background.png") ||
    findCoralAssetUrl("background/background.png");
  if (named) return named;
  const hit = Object.keys(coralAssetModules).find((k) => {
    const p = k.replaceAll("\\", "/").toLowerCase();
    return p.includes("/background/") && p.endsWith(".png");
  });
  return hit ? coralAssetModules[hit] : BG_URL_FALLBACK;
}

function resolvePhoneFrameUrl() {
  return (
    findCoralAssetUrl("手机框_遮罩增大.png") ||
    findCoralAssetUrlByNeedle("遮罩增大") ||
    findCoralAssetUrl("phone_frame_mask.png") ||
    findCoralAssetUrlByNeedle("phone_frame_mask") ||
    PHONE_FRAME_URL_FALLBACK
  );
}

function resolveTwinsUrl() {
  return (
    findCoralAssetUrl("双子.png") ||
    findCoralAssetUrlByNeedle("双子") ||
    TWINS_URL_FALLBACK
  );
}

const BACKGROUND_URL = resolveBackgroundUrl();
const PHONE_FRAME_URL = resolvePhoneFrameUrl();
const TWINS_URL = resolveTwinsUrl();

let mounted = false;
let rootEl = null;
let exitBtn = null;
let stageEl = null;
let phoneFollowerEl = null;
let phoneFrameImgEl = null;
let twinsLayerEl = null;
let twinsImgEl = null;

let phoneCursorActive = false;
let twinsVisible = false;
let dblClickBound = false;
let pointerMoveBound = false;

function getCanvas() {
  return document.querySelector("#app");
}

function isOpen() {
  return Boolean(rootEl?.classList.contains(OPEN_CLASS));
}

function normalizeUrl(url) {
  return url.replace(/\\/g, "/");
}

function setPhoneFollowerPosition(clientX, clientY) {
  if (!phoneFollowerEl) return;
  phoneFollowerEl.style.left = `${clientX}px`;
  phoneFollowerEl.style.top = `${clientY}px`;
}

function onPhonePointerMove(e) {
  if (!phoneCursorActive) return;
  setPhoneFollowerPosition(e.clientX, e.clientY);
}

function bindPhonePointerMove() {
  if (pointerMoveBound) return;
  window.addEventListener("pointermove", onPhonePointerMove, { passive: true });
  pointerMoveBound = true;
}

function unbindPhonePointerMove() {
  if (!pointerMoveBound) return;
  window.removeEventListener("pointermove", onPhonePointerMove);
  pointerMoveBound = false;
}

function disablePhoneCursor() {
  phoneCursorActive = false;
  document.body.classList.remove(PHONE_CURSOR_CLASS);
  phoneFollowerEl?.setAttribute("hidden", "");
  phoneFollowerEl?.setAttribute("aria-hidden", "true");
  unbindPhonePointerMove();
}

function enablePhoneCursor(clientX, clientY) {
  if (!phoneFollowerEl || !stageEl) return;
  phoneCursorActive = true;
  document.body.classList.add(PHONE_CURSOR_CLASS);
  phoneFollowerEl.removeAttribute("hidden");
  phoneFollowerEl.setAttribute("aria-hidden", "false");
  applyPhoneFrameSrc();
  setPhoneFollowerPosition(clientX, clientY);
  bindPhonePointerMove();
}

function applyPhoneFrameSrc() {
  if (!phoneFrameImgEl) return;
  phoneFrameImgEl.src = normalizeUrl(PHONE_FRAME_URL);
}

function applyTwinsSrc() {
  if (!twinsImgEl) return;
  twinsImgEl.src = normalizeUrl(TWINS_URL);
}

function hideTwins() {
  twinsVisible = false;
  twinsLayerEl?.setAttribute("hidden", "");
  twinsLayerEl?.setAttribute("aria-hidden", "true");
  twinsLayerEl?.classList.remove("coral-door-scene__twins-layer--visible");
}

function showTwins() {
  if (!twinsLayerEl) return;
  twinsVisible = true;
  twinsLayerEl.removeAttribute("hidden");
  twinsLayerEl.setAttribute("aria-hidden", "false");
  twinsLayerEl.classList.add("coral-door-scene__twins-layer--visible");
}

function onStageDblClick(e) {
  if (!isOpen()) return;
  if (e.target.closest(".coral-door-scene-exit")) return;
  if (e.target.closest(".layout-panel")) return;
  e.preventDefault();
  if (!phoneCursorActive) {
    enablePhoneCursor(e.clientX, e.clientY);
    return;
  }
  if (!twinsVisible) {
    showTwins();
  }
}

function hide() {
  hideTwins();
  disablePhoneCursor();
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
  const u = normalizeUrl(BACKGROUND_URL);
  stageEl.style.backgroundImage = `url("${u}")`;
}

function refreshDomRefs() {
  rootEl = document.getElementById("coral-door-scene-root");
  exitBtn = document.getElementById("coral-door-scene-exit");
  stageEl = rootEl?.querySelector(".coral-door-scene__stage") ?? null;
  phoneFollowerEl = rootEl?.querySelector(".coral-door-scene__phone-follower") ?? null;
  phoneFrameImgEl = rootEl?.querySelector(".coral-door-scene__phone-frame") ?? null;
  twinsLayerEl = rootEl?.querySelector(".coral-door-scene__twins-layer") ?? null;
  twinsImgEl = rootEl?.querySelector(".coral-door-scene__twins") ?? null;
}

export function mountCoralDoorBehindScene() {
  if (mounted) return;
  refreshDomRefs();
  if (!rootEl || !exitBtn || !stageEl || !phoneFollowerEl || !phoneFrameImgEl) {
    console.warn("[coralDoorBehindScene] 缺少 DOM", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
      stageEl: Boolean(stageEl),
      phoneFollowerEl: Boolean(phoneFollowerEl),
      phoneFrameImgEl: Boolean(phoneFrameImgEl),
    });
    return;
  }

  rootEl.classList.remove(OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;
  hideTwins();
  disablePhoneCursor();
  applyBgSrc();
  applyPhoneFrameSrc();
  applyTwinsSrc();

  exitBtn.addEventListener("click", onExitActivate, true);
  exitBtn.addEventListener("pointerup", onExitActivate, true);
  window.addEventListener("keydown", onKeydown, true);

  if (!dblClickBound) {
    stageEl.addEventListener("dblclick", onStageDblClick);
    dblClickBound = true;
  }

  mounted = true;
}

export function showCoralDoorBehindScene() {
  if (!mounted) {
    mountCoralDoorBehindScene();
  }
  refreshDomRefs();
  if (!rootEl || !exitBtn || !stageEl) return;

  hideTwins();
  disablePhoneCursor();
  applyBgSrc();
  applyPhoneFrameSrc();
  applyTwinsSrc();

  rootEl.hidden = false;
  rootEl.classList.add(OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";
}
