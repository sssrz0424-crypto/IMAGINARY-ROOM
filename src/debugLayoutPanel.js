/**
 * 画面排布调试面板：用 NDC + 深度 + 屏幕高度比例 调整构图。
 * 在浏览器地址后加 ?layout=1 显示；不加则默认隐藏（避免正式展示时挡画面）。
 */

import { attachLayoutPanelDragResize } from "./layoutPanelDragResize.js";

const LAYOUT_QUERY = "layout";

export function shouldShowLayoutPanel() {
  return new URLSearchParams(window.location.search).get(LAYOUT_QUERY) === "1";
}

export function mountLayoutDebugPanel({
  camera,
  doorSpecs,
  modelSpecs,
  doorMotion,
  getMeshByLabel,
  applySpecToMesh,
  refreshAllMeshesAndLayout,
}) {
  if (!shouldShowLayoutPanel()) {
    return null;
  }

  const root = document.createElement("aside");
  root.className = "layout-panel";
  root.innerHTML = `
    <div class="layout-panel__header">
      <strong>画面排布</strong>
      <span class="layout-panel__hint">?layout=1</span>
      <button type="button" class="layout-panel__collapse" aria-label="收起">−</button>
    </div>
    <div class="layout-panel__body">
      <label class="layout-panel__row">
        <span>当前元素</span>
        <select class="layout-panel__select"></select>
      </label>
      <div class="layout-panel__grid" data-sliders></div>
      <fieldset class="layout-panel__fieldset" data-motion-fieldset>
        <legend>门 · 漂浮与悬停</legend>
        <label class="layout-panel__row">
          <span>漂浮幅度（占屏高比）</span>
          <input type="range" data-motion="floatAmplitude" min="0" max="0.08" step="0.001" />
          <input type="number" data-motion-num="floatAmplitude" min="0" max="0.08" step="0.001" />
        </label>
        <label class="layout-panel__row">
          <span>漂浮频率</span>
          <input type="range" data-motion="floatFrequency" min="0.2" max="2.5" step="0.02" />
          <input type="number" data-motion-num="floatFrequency" min="0.2" max="2.5" step="0.02" />
        </label>
        <label class="layout-panel__row">
          <span>悬停放大倍率</span>
          <input type="range" data-motion="hoverScaleMul" min="1.02" max="1.35" step="0.005" />
          <input type="number" data-motion-num="hoverScaleMul" min="1.02" max="1.35" step="0.005" />
        </label>
        <label class="layout-panel__row">
          <span>悬停缩放平滑</span>
          <input type="range" data-motion="hoverLerpSpeed" min="2" max="22" step="0.5" />
          <input type="number" data-motion-num="hoverLerpSpeed" min="2" max="22" step="0.5" />
        </label>
      </fieldset>
      <fieldset class="layout-panel__fieldset">
        <legend>相机（整体取景）</legend>
        <label class="layout-panel__row">
          <span>FOV 视角</span>
          <input type="range" data-cam="fov" min="20" max="75" step="0.5" />
          <input type="number" data-cam="fov-num" min="20" max="75" step="0.5" />
        </label>
        <label class="layout-panel__row">
          <span>相机 Z（远近）</span>
          <input type="range" data-cam="posZ" min="6" max="40" step="0.05" />
          <input type="number" data-cam="posZ-num" min="6" max="40" step="0.05" />
        </label>
      </fieldset>
      <div class="layout-panel__actions">
        <button type="button" data-action="export">复制构图 JSON</button>
        <button type="button" data-action="log">在控制台打印</button>
      </div>
      <p class="layout-panel__help">
        NDC：画面坐标，中心为 0；左负右正，下负上正。Z：负得越多越远。
        「高度比」= 该深度下占屏幕高度的比例。
        门漂浮幅度=相对该门深度处可见屏高的比例（如 0.02 即约 2% 屏高）。
      </p>
    </div>
  `;

  document.body.appendChild(root);

  const body = root.querySelector(".layout-panel__body");
  const collapseBtn = root.querySelector(".layout-panel__collapse");
  collapseBtn.addEventListener("click", () => {
    root.classList.toggle("layout-panel--collapsed");
    collapseBtn.textContent = root.classList.contains("layout-panel--collapsed")
      ? "+"
      : "−";
  });

  const select = root.querySelector(".layout-panel__select");
  const sliderHost = root.querySelector("[data-sliders]");

  const allEntries = [
    ...doorSpecs.map((spec) => ({ spec, group: "门" })),
    ...modelSpecs.map((spec) => ({ spec, group: "模特" })),
  ];

  allEntries.forEach(({ spec, group }) => {
    const option = document.createElement("option");
    option.value = spec.label;
    option.textContent = `${group}: ${spec.label}`;
    select.appendChild(option);
  });

  const fields = [
    { key: "ndcX", label: "NDC X（左右）", min: -1, max: 1, step: 0.005 },
    { key: "ndcY", label: "NDC Y（上下）", min: -1, max: 1, step: 0.005 },
    { key: "z", label: "深度 Z", min: -48, max: -1.5, step: 0.05 },
    {
      key: "viewHeightFraction",
      label: "高度比（屏高）",
      min: 0.06,
      max: 0.95,
      step: 0.005,
    },
    { key: "rotZDeg", label: "旋转 Z（°）面内倾角", min: -90, max: 90, step: 0.5 },
    { key: "rotYDeg", label: "旋转 Y（°）左右转向", min: -90, max: 90, step: 0.5 },
    { key: "scaleMul", label: "缩放倍率", min: 0.4, max: 2.2, step: 0.01 },
  ];

  fields.forEach((field) => {
    const wrap = document.createElement("label");
    wrap.className = "layout-panel__row";
    wrap.innerHTML = `
      <span>${field.label}</span>
      <input type="range" data-key="${field.key}" min="${field.min}" max="${field.max}" step="${field.step}" />
      <input type="number" data-key-num="${field.key}" min="${field.min}" max="${field.max}" step="${field.step}" />
    `;
    sliderHost.appendChild(wrap);
  });

  function getSelectedSpec() {
    const label = select.value;
    return allEntries.find((entry) => entry.spec.label === label)?.spec ?? null;
  }

  function readControlsIntoSpec(spec) {
    fields.forEach((field) => {
      const range = sliderHost.querySelector(`input[data-key="${field.key}"]`);
      const num = sliderHost.querySelector(`input[data-key-num="${field.key}"]`);
      const value = Number(range.value);
      spec[field.key] = value;
      num.value = String(value);
    });
  }

  function writeSpecIntoControls(spec) {
    fields.forEach((field) => {
      const range = sliderHost.querySelector(`input[data-key="${field.key}"]`);
      const num = sliderHost.querySelector(`input[data-key-num="${field.key}"]`);
      const value = spec[field.key];
      range.value = String(value);
      num.value = String(value);
    });
  }

  function syncCameraControls() {
    const fovRange = root.querySelector('input[data-cam="fov"]');
    const fovNum = root.querySelector('input[data-cam="fov-num"]');
    const zRange = root.querySelector('input[data-cam="posZ"]');
    const zNum = root.querySelector('input[data-cam="posZ-num"]');
    fovRange.value = String(camera.fov);
    fovNum.value = String(camera.fov);
    zRange.value = String(camera.position.z);
    zNum.value = String(camera.position.z);
  }

  function bindRangeNumPair(rangeSelector, numSelector, onCommit) {
    const range = root.querySelector(rangeSelector);
    const num = root.querySelector(numSelector);
    range.addEventListener("input", () => {
      num.value = range.value;
      onCommit(Number(range.value));
    });
    num.addEventListener("change", () => {
      range.value = num.value;
      onCommit(Number(num.value));
    });
  }

  bindRangeNumPair('input[data-cam="fov"]', 'input[data-cam="fov-num"]', (v) => {
    camera.fov = v;
    refreshAllMeshesAndLayout();
    syncCameraControls();
  });

  bindRangeNumPair('input[data-cam="posZ"]', 'input[data-cam="posZ-num"]', (v) => {
    camera.position.z = v;
    refreshAllMeshesAndLayout();
    syncCameraControls();
  });

  function syncMotionControls() {
    if (!doorMotion) return;
    const keys = [
      "floatAmplitude",
      "floatFrequency",
      "hoverScaleMul",
      "hoverLerpSpeed",
    ];
    keys.forEach((key) => {
      const range = root.querySelector(`input[data-motion="${key}"]`);
      const num = root.querySelector(`input[data-motion-num="${key}"]`);
      if (range && num) {
        range.value = String(doorMotion[key]);
        num.value = String(doorMotion[key]);
      }
    });
  }

  function bindMotionPair(key, min, max) {
    const range = root.querySelector(`input[data-motion="${key}"]`);
    const num = root.querySelector(`input[data-motion-num="${key}"]`);
    if (!doorMotion || !range || !num) return;
    range.addEventListener("input", () => {
      num.value = range.value;
      doorMotion[key] = Number(range.value);
    });
    num.addEventListener("change", () => {
      const raw = Number(num.value);
      const v = Math.min(max, Math.max(min, raw));
      num.value = String(v);
      range.value = String(v);
      doorMotion[key] = v;
    });
  }

  if (doorMotion) {
    syncMotionControls();
    bindMotionPair("floatAmplitude", 0, 0.08);
    bindMotionPair("floatFrequency", 0.2, 2.5);
    bindMotionPair("hoverScaleMul", 1.02, 1.35);
    bindMotionPair("hoverLerpSpeed", 2, 22);
  } else {
    root.querySelector("[data-motion-fieldset]")?.remove();
  }

  fields.forEach((field) => {
    const range = sliderHost.querySelector(`input[data-key="${field.key}"]`);
    const num = sliderHost.querySelector(`input[data-key-num="${field.key}"]`);
    range.addEventListener("input", () => {
      num.value = range.value;
      const spec = getSelectedSpec();
      if (!spec) return;
      spec[field.key] = Number(range.value);
      const mesh = getMeshByLabel(spec.label);
      if (mesh) {
        applySpecToMesh(mesh);
      }
    });
    num.addEventListener("change", () => {
      range.value = num.value;
      const spec = getSelectedSpec();
      if (!spec) return;
      spec[field.key] = Number(num.value);
      const mesh = getMeshByLabel(spec.label);
      if (mesh) {
        applySpecToMesh(mesh);
      }
    });
  });

  select.addEventListener("change", () => {
    const spec = getSelectedSpec();
    if (spec) {
      writeSpecIntoControls(spec);
    }
  });

  root.querySelector('[data-action="export"]').addEventListener("click", async () => {
    const payload = {
      camera: { fov: camera.fov, positionZ: camera.position.z },
      doorMotion: doorMotion ? { ...doorMotion } : undefined,
      doors: doorSpecs.map((spec) => ({ ...spec })),
      models: modelSpecs.map((spec) => ({ ...spec })),
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert("已复制到剪贴板，可粘贴回 main.js 里的 DOOR_SPECS / MODEL_SPECS。");
    } catch {
      console.log(text);
      alert("复制失败，已打印到控制台。");
    }
  });

  root.querySelector('[data-action="log"]').addEventListener("click", () => {
    console.log("layout snapshot", {
      camera: { fov: camera.fov, positionZ: camera.position.z },
      doorMotion: doorMotion ? { ...doorMotion } : undefined,
      doors: doorSpecs,
      models: modelSpecs,
    });
  });

  syncCameraControls();
  const first = getSelectedSpec();
  if (first) {
    writeSpecIntoControls(first);
  }

  attachLayoutPanelDragResize(root, "layoutDebug");

  return {
    notifyMeshLoaded(label) {
      if (select.value !== label) return;
      const spec = allEntries.find((entry) => entry.spec.label === label)?.spec;
      if (spec) {
        writeSpecIntoControls(spec);
      }
    },
  };
}
