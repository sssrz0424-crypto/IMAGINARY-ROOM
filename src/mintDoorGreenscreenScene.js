/**
 * 薄荷绿门（doorId 5，label teal）后：绿幕背景 + 四列素材从左到右；
 * scene 内第一次双击显露素材 1，第二次双击显露 2，直至四张全部出现。
 */
import {
  applyMintGreenscreenLayoutToDom,
  getMintGreenscreenLayoutState,
} from "./mintDoorGreenscreenLayoutPanel.js";

const BODY_CLASS = "doors-ui--mint-greenscreen";
const OPEN_CLASS = "mint-door-greenscreen--open";
const EXIT_VISIBLE_CLASS = "mint-door-greenscreen-exit--visible";
const SLOT_VISIBLE_CLASS = "mint-door-greenscreen__slot--visible";

const BG_URL_FALLBACK = "/mint_door_scene/background.jpg";

const mintAssetModules = import.meta.glob("../assets/mint_door_scene/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function findMintAssetUrl(filename) {
  const n = filename.toLowerCase();
  const hit = Object.keys(mintAssetModules).find((key) =>
    key.replaceAll("\\", "/").toLowerCase().endsWith(`/${n}`)
  );
  return hit ? mintAssetModules[hit] : null;
}

function resolveBackgroundUrl() {
  const named = findMintAssetUrl("background.jpg");
  if (named) return named;
  const hit = Object.keys(mintAssetModules).find((k) =>
    k.replaceAll("\\", "/").toLowerCase().includes("background")
  );
  return hit ? mintAssetModules[hit] : BG_URL_FALLBACK;
}

/** 从左到右对应 1.png … 4.png */
function resolveLayerUrls() {
  const urls = [];
  for (let i = 1; i <= 4; i++) {
    urls.push(findMintAssetUrl(`${i}.png`) ?? `/mint_door_scene/${i}.png`);
  }
  return urls;
}

const BACKGROUND_URL = resolveBackgroundUrl();
const LAYER_URLS = resolveLayerUrls();

let mounted = false;
let rootEl = null;
let exitBtn = null;
let stageEl = null;
let slotEls = [];
let visibleLayerCount = 0;
let dblClickBound = false;

function getCanvas() {
  return document.querySelector("#app");
}

function isOpen() {
  return Boolean(rootEl?.classList.contains(OPEN_CLASS));
}

function setVisibleLayerCount(n) {
  visibleLayerCount = Math.max(0, Math.min(4, n));
  slotEls.forEach((slot, i) => {
    slot.classList.toggle(SLOT_VISIBLE_CLASS, i < visibleLayerCount);
  });
}

function assignLayerSources() {
  slotEls.forEach((slot, i) => {
    const img = slot.querySelector(".mint-door-greenscreen__layer-img");
    if (img) {
      img.src = LAYER_URLS[i] ?? "";
    }
  });
}

function onStageDblClick(e) {
  if (!isOpen()) return;
  if (!stageEl?.contains(e.target)) return;
  e.preventDefault();
  try {
    window.getSelection()?.removeAllRanges();
  } catch {
    /* ignore */
  }

  if (visibleLayerCount >= 4) return;
  setVisibleLayerCount(visibleLayerCount + 1);
}

function hide() {
  rootEl?.classList.remove(OPEN_CLASS);
  exitBtn?.classList.remove(EXIT_VISIBLE_CLASS);
  setVisibleLayerCount(0);
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

function refreshDomRefs() {
  rootEl = document.getElementById("mint-door-greenscreen-root");
  exitBtn = document.getElementById("mint-door-greenscreen-exit");
  stageEl = rootEl?.querySelector(".mint-door-greenscreen__stage") ?? null;
  slotEls = Array.from(rootEl?.querySelectorAll("[data-mint-layer-index]") ?? []).sort(
    (a, b) =>
      Number(a.dataset.mintLayerIndex) - Number(b.dataset.mintLayerIndex)
  );
}

export function mountMintDoorGreenscreenScene() {
  if (mounted) return;
  refreshDomRefs();
  if (!rootEl || !exitBtn || !stageEl) {
    console.warn("[mintDoorGreenscreenScene] 缺少 DOM", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
      stageEl: Boolean(stageEl),
    });
    return;
  }

  rootEl.classList.remove(OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;
  applyBgSrc();
  assignLayerSources();
  applyMintGreenscreenLayoutToDom(getMintGreenscreenLayoutState());
  setVisibleLayerCount(0);

  exitBtn.addEventListener("click", onExitActivate, true);
  exitBtn.addEventListener("pointerup", onExitActivate, true);
  window.addEventListener("keydown", onKeydown, true);

  if (!dblClickBound) {
    stageEl.addEventListener("dblclick", onStageDblClick);
    dblClickBound = true;
  }

  mounted = true;
}

export function showMintDoorGreenscreenScene() {
  if (!mounted) {
    mountMintDoorGreenscreenScene();
  }
  refreshDomRefs();
  if (!rootEl || !exitBtn || !stageEl) return;

  applyBgSrc();
  assignLayerSources();
  applyMintGreenscreenLayoutToDom(getMintGreenscreenLayoutState());
  setVisibleLayerCount(0);

  rootEl.hidden = false;
  rootEl.classList.add(OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";
}
