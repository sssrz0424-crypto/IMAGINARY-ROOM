import * as THREE from "three";
import "./style.css";
import { mountLayoutDebugPanel } from "./debugLayoutPanel.js";
import { doorMotion } from "./doorMotionConfig.js";
import { switchScene, DOOR_LABEL_TO_ID } from "./switchScene.js";
import { runFadeThroughBlack } from "./sceneTransition.js";
import { mountWhiteDoorGalleryScene } from "./whiteDoorGalleryScene.js";
import { mountRedDoorBehindScene } from "./redDoorBehindScene.js";
import { mountBlueDoorVoidScene } from "./blueDoorVoidScene.js";
import { mountGreenDoorVoidScene } from "./greenDoorVoidScene.js";
import { mountMintDoorGreenscreenScene } from "./mintDoorGreenscreenScene.js";
import { mountPurpleDoorBehindScene } from "./purpleDoorBehindScene.js";
import { mountPinkDoorBehindScene } from "./pinkDoorBehindScene.js";
import { mountYellowDoorScene } from "./yellowDoorScene.js";
import { mountCoralDoorBehindScene } from "./coralDoorBehindScene.js";
import {
  initYellowPortraitLayoutFromStorage,
  mountYellowDoorPortraitLayoutPanel,
} from "./yellowDoorPortraitLayoutPanel.js";
import {
  initRedSceneLayoutFromStorage,
  mountRedDoorLayoutPanel,
} from "./redDoorLayoutPanel.js";
import {
  initBlueVoidLayoutFromStorage,
  mountBlueDoorVoidLayoutPanel,
} from "./blueDoorVoidLayoutPanel.js";
import {
  initMintGreenscreenLayoutFromStorage,
  mountMintDoorGreenscreenLayoutPanel,
} from "./mintDoorGreenscreenLayoutPanel.js";
import {
  initPurpleModelLayoutFromStorage,
  mountPurpleDoorModelLayoutPanel,
} from "./purpleDoorModelLayoutPanel.js";
import {
  initMirrorHudLayoutFromStorage,
  mountBlueMirrorHudLayoutPanel,
} from "./blueMirrorHudLayoutPanel.js";
import {
  initPinkPosterLayoutFromStorage,
  mountPinkDoorPosterLayoutPanel,
} from "./pinkDoorPosterLayoutPanel.js";

/**
 * 为什么用 NDC（归一化设备坐标）而不是直接写 world x/y？
 * 参考图是「平面上的构图」：元素在画面上的左右、上下位置是首要的。
 * 透视下同一组 world x,y 换深度 z 后，投到屏幕上的位置会漂。
 * 做法是：你按「在画面上的位置」填 ndcX/ndcY（-1~1，中心为 0），再选深度 z，
 * 用相机反投影求出该像素射线与 z=常数平面的交点，得到稳定的 world 位置。
 */

mountWhiteDoorGalleryScene();
mountRedDoorBehindScene();
mountBlueDoorVoidScene();
mountGreenDoorVoidScene();
mountMintDoorGreenscreenScene();
mountPurpleDoorBehindScene();
mountPinkDoorBehindScene();
mountYellowDoorScene();
mountCoralDoorBehindScene();
initRedSceneLayoutFromStorage();
initBlueVoidLayoutFromStorage();
initMintGreenscreenLayoutFromStorage();
initMirrorHudLayoutFromStorage();
initPurpleModelLayoutFromStorage();
initYellowPortraitLayoutFromStorage();
initPinkPosterLayoutFromStorage();
mountRedDoorLayoutPanel();
mountBlueDoorVoidLayoutPanel();
mountMintDoorGreenscreenLayoutPanel();
mountBlueMirrorHudLayoutPanel();
mountPurpleDoorModelLayoutPanel();
mountYellowDoorPortraitLayoutPanel();
mountPinkDoorPosterLayoutPanel();

const canvas = document.querySelector("#app");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.sortObjects = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  300
);
camera.position.set(0, 0, 25.27);
scene.add(camera);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.88);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
directionalLight.position.set(4, 7, 5);
scene.add(directionalLight);

const textureLoader = new THREE.TextureLoader();
const doorTextureModules = import.meta.glob("../assets/door_*", {
  eager: true,
  query: "?url",
  import: "default",
});
const modelTextureModules = import.meta.glob("../assets/model_*", {
  eager: true,
  query: "?url",
  import: "default",
});

function findAssetUrl(modules, needle) {
  const hit = Object.keys(modules).find((key) =>
    key.replaceAll("\\", "/").includes(needle)
  );
  return hit ? modules[hit] : null;
}

const ndcScratch = new THREE.Vector3();

function worldUnitsVisibleHeightAtZ(worldZ) {
  const distance = camera.position.z - worldZ;
  return 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
}

/**
 * 将 NDC 点 (ndcX, ndcY) 与固定 worldZ 平面求交，得到世界坐标 x,y。
 * 相机无旋转、朝 -Z 时等价于「这个像素在深度 worldZ 处对应哪一点」。
 */
function worldXYFromNdc(ndcX, ndcY, worldZ) {
  ndcScratch.set(ndcX, ndcY, 0.5);
  ndcScratch.unproject(camera);
  const origin = camera.position;
  const dir = ndcScratch.sub(origin).normalize();
  const t = (worldZ - origin.z) / dir.z;
  return {
    x: origin.x + t * dir.x,
    y: origin.y + t * dir.y,
  };
}

function applyLayout(mesh) {
  const spec = mesh.userData.layoutSpec;
  const { x, y } = worldXYFromNdc(spec.ndcX, spec.ndcY, spec.z);
  mesh.position.set(x, y, spec.z);
  mesh.rotation.z = THREE.MathUtils.degToRad(spec.rotZDeg);
  const swingY = mesh.userData.isDoor ? (mesh.userData.doorSwingYRad ?? 0) : 0;
  mesh.rotation.y = THREE.MathUtils.degToRad(spec.rotYDeg) + swingY;
}

/** 构图表：由布局面板导出 JSON 固化（可按需再调） */
const DOOR_SPECS = [
  {
    label: "green",
    urlNeedle: "door_green",
    ndcX: 0.825,
    ndcY: 0.595,
    z: -29,
    rotZDeg: 0,
    rotYDeg: -64,
    viewHeightFraction: 0.3,
    scaleMul: 0.95,
  },
  {
    label: "white",
    urlNeedle: "door_white",
    ndcX: -0.54,
    ndcY: 0.85,
    z: -21.55,
    rotZDeg: 32,
    rotYDeg: 47,
    viewHeightFraction: 0.525,
    scaleMul: 1.06,
  },
  {
    label: "yellow",
    urlNeedle: "door_yellow",
    ndcX: -0.76,
    ndcY: 0.52,
    z: -14.5,
    rotZDeg: 0,
    rotYDeg: 50,
    viewHeightFraction: 0.495,
    scaleMul: 1,
  },
  {
    label: "pink",
    urlNeedle: "door_pink",
    ndcX: 0.83,
    ndcY: -0.59,
    z: -5.45,
    rotZDeg: -29.5,
    rotYDeg: -60,
    viewHeightFraction: 0.73,
    scaleMul: 0.9,
  },
  {
    label: "teal",
    urlNeedle: "door_mint",
    ndcX: 0.51,
    ndcY: 0.01,
    z: -13.65,
    rotZDeg: 40.5,
    rotYDeg: -10,
    viewHeightFraction: 0.61,
    scaleMul: 1,
  },
  {
    label: "orange",
    urlNeedle: "door_coral",
    ndcX: 0.325,
    ndcY: -0.57,
    z: -20.65,
    rotZDeg: 23,
    rotYDeg: 21.5,
    viewHeightFraction: 0.41,
    scaleMul: 1,
  },
  {
    label: "purple",
    urlNeedle: "door_purple",
    ndcX: 0.295,
    ndcY: 0.56,
    z: -19.25,
    rotZDeg: -35,
    rotYDeg: 12.5,
    viewHeightFraction: 0.69,
    scaleMul: 0.99,
  },
  {
    label: "blue",
    urlNeedle: "door_.1",
    ndcX: -0.55,
    ndcY: -0.445,
    z: -7.6,
    rotZDeg: 0,
    rotYDeg: 3.5,
    viewHeightFraction: 0.77,
    scaleMul: 1,
  },
  {
    label: "red",
    urlNeedle: "door_red",
    ndcX: -0.09,
    ndcY: -0.005,
    z: -6.1,
    rotZDeg: 0,
    rotYDeg: 0,
    viewHeightFraction: 0.825,
    scaleMul: 1.05,
  },
];

const MODEL_SPECS = [
  {
    label: "sit",
    urlNeedle: "model_sit",
    ndcX: -0.47,
    ndcY: -0.37,
    z: -3.25,
    rotZDeg: -3.5,
    rotYDeg: 10,
    viewHeightFraction: 0.51,
    scaleMul: 1.6,
  },
  {
    label: "wave",
    urlNeedle: "model_wave",
    ndcX: 0.69,
    ndcY: 0.37,
    z: -1.5,
    rotZDeg: 1,
    rotYDeg: -11,
    viewHeightFraction: 0.67,
    scaleMul: 1.05,
  },
];

const layoutMeshes = [];
const doorMeshes = [];
const modelFloatEntries = [];
const doorFloatEntries = [];
const labelToMesh = {};

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let hoveredDoor = null;
let lastFrameTime = performance.now();

/** 开门动画进行中或淡入淡出时禁止再次触发 */
let sceneTransitionLocked = false;

const DOOR_IDS_WITH_OVERLAY_SCENE = new Set([
  DOOR_LABEL_TO_ID.green,
  DOOR_LABEL_TO_ID.white,
  DOOR_LABEL_TO_ID.yellow,
  DOOR_LABEL_TO_ID.pink,
  DOOR_LABEL_TO_ID.teal,
  DOOR_LABEL_TO_ID.orange,
  DOOR_LABEL_TO_ID.purple,
  DOOR_LABEL_TO_ID.blue,
  DOOR_LABEL_TO_ID.red,
]);

const DOOR_OPEN_DURATION_MS = 750;
const DOOR_OPEN_SWING_RAD = -Math.PI / 2;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function syncDoorRotationFromLayoutSpec(mesh) {
  const spec = mesh.userData.layoutSpec;
  const swing = mesh.userData.doorSwingYRad ?? 0;
  mesh.rotation.y = THREE.MathUtils.degToRad(spec.rotYDeg) + swing;
  mesh.rotation.z = THREE.MathUtils.degToRad(spec.rotZDeg);
}

function resetDoorAfterSceneTransition(mesh) {
  mesh.userData.doorSwingYRad = 0;
  delete mesh.userData.doorOpenAnim;
  const entry = doorFloatEntries.find((e) => e.mesh === mesh);
  if (entry) {
    entry.freezeForOpen = false;
  }
  applyLayout(mesh);
}

function beginFadeAndSwitchScene(doorMesh, doorId) {
  if (sceneTransitionLocked) return;
  sceneTransitionLocked = true;
  runFadeThroughBlack(() => {
    try {
      switchScene(doorId);
    } finally {
      resetDoorAfterSceneTransition(doorMesh);
      sceneTransitionLocked = false;
    }
  });
}

function makeBillboardMaterial(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
    transparent: true,
    depthTest: true,
    depthWrite: true,
    alphaTest: 0.1,
  });
}

function relayoutAll() {
  camera.updateProjectionMatrix();
  layoutMeshes.forEach((mesh) => applyLayout(mesh));
  modelFloatEntries.forEach((entry) => {
    entry.baseY = entry.mesh.position.y;
  });
  doorFloatEntries.forEach((entry) => {
    entry.baseY = entry.mesh.position.y;
  });
}

function applySpecToMesh(mesh) {
  if (!mesh) return;
  const spec = mesh.userData.layoutSpec;
  const worldH =
    worldUnitsVisibleHeightAtZ(spec.z) *
    spec.viewHeightFraction *
    (spec.scaleMul ?? 1);
  const worldW = worldH * mesh.userData.texAspect;
  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(worldW, worldH);
  applyLayout(mesh);
  const modelEntry = modelFloatEntries.find((e) => e.mesh === mesh);
  const doorEntry = doorFloatEntries.find((e) => e.mesh === mesh);
  if (modelEntry) {
    modelEntry.baseY = mesh.position.y;
  }
  if (doorEntry) {
    doorEntry.baseY = mesh.position.y;
  }
}

function refreshAllMeshesAndLayout() {
  camera.updateProjectionMatrix();
  layoutMeshes.forEach((mesh) => {
    const spec = mesh.userData.layoutSpec;
    const worldH =
      worldUnitsVisibleHeightAtZ(spec.z) *
      spec.viewHeightFraction *
      (spec.scaleMul ?? 1);
    const worldW = worldH * mesh.userData.texAspect;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(worldW, worldH);
  });
  relayoutAll();
}

const layoutPanelApi = mountLayoutDebugPanel({
  camera,
  doorSpecs: DOOR_SPECS,
  modelSpecs: MODEL_SPECS,
  doorMotion,
  getMeshByLabel: (label) => labelToMesh[label],
  applySpecToMesh,
  refreshAllMeshesAndLayout,
});

function addTexturedPlane(url, spec, kind) {
  if (!url) {
    console.warn(`Missing texture for ${kind}: ${spec.label} (${spec.urlNeedle})`);
    return;
  }

  textureLoader.load(
    url,
    (texture) => {
      const material = makeBillboardMaterial(texture);
      const texAspect = texture.image.width / texture.image.height;
      const worldH =
        worldUnitsVisibleHeightAtZ(spec.z) *
        spec.viewHeightFraction *
        (spec.scaleMul ?? 1);
      const worldW = worldH * texAspect;
      const geometry = new THREE.PlaneGeometry(worldW, worldH);
      const mesh = new THREE.Mesh(geometry, material);

      mesh.userData.layoutSpec = spec;
      mesh.userData.texAspect = texAspect;
      applyLayout(mesh);

      scene.add(mesh);
      layoutMeshes.push(mesh);
      labelToMesh[spec.label] = mesh;
      mesh.userData.isDoor = kind === "door";

      if (kind === "door") {
        doorMeshes.push(mesh);
        mesh.scale.setScalar(1);
        doorFloatEntries.push({
          mesh,
          baseY: mesh.position.y,
          phase: spec.label.length * 0.41 + 0.2,
          displayScale: 1,
        });
      } else {
        modelFloatEntries.push({
          mesh,
          baseY: mesh.position.y,
          phase: spec.label.length * 0.41,
          amplitude: 0.015,
        });
      }

      layoutPanelApi?.notifyMeshLoaded(spec.label);
    },
    undefined,
    (error) => {
      console.error(`Failed to load ${kind} ${spec.label}:`, url, error);
    }
  );
}

const sortedDoors = [...DOOR_SPECS].sort((a, b) => a.z - b.z);
sortedDoors.forEach((spec) => {
  const url = findAssetUrl(doorTextureModules, spec.urlNeedle);
  addTexturedPlane(url, spec, "door");
});

MODEL_SPECS.forEach((spec) => {
  const url = findAssetUrl(modelTextureModules, spec.urlNeedle);
  addTexturedPlane(url, spec, "model");
});

function pickDoorAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(doorMeshes, false);
  return hits.length > 0 ? hits[0].object : null;
}

canvas.addEventListener("pointermove", (event) => {
  hoveredDoor = pickDoorAt(event.clientX, event.clientY);
  canvas.style.cursor = hoveredDoor ? "pointer" : "default";
});

canvas.addEventListener("dblclick", (event) => {
  if (sceneTransitionLocked) return;
  if (doorMeshes.some((m) => m.userData.doorOpenAnim)) return;

  const door = pickDoorAt(event.clientX, event.clientY);
  if (!door) return;

  event.preventDefault();

  const doorId = DOOR_LABEL_TO_ID[door.userData.layoutSpec.label];
  if (doorId == null) {
    console.warn("未配置 doorId:", door.userData.layoutSpec.label);
    return;
  }

  if (!DOOR_IDS_WITH_OVERLAY_SCENE.has(doorId)) {
    return;
  }

  const entry = doorFloatEntries.find((e) => e.mesh === door);
  if (entry) {
    entry.freezeForOpen = true;
  }

  door.userData.doorOpenAnim = {
    startMs: performance.now(),
    durationMs: DOOR_OPEN_DURATION_MS,
    doorId,
  };
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  relayoutAll();
});

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const time = now * 0.001;
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  doorMeshes.forEach((mesh) => {
    const anim = mesh.userData.doorOpenAnim;
    if (!anim) return;
    const t = Math.min(1, (now - anim.startMs) / anim.durationMs);
    const e = easeInOutCubic(t);
    mesh.userData.doorSwingYRad = DOOR_OPEN_SWING_RAD * e;
    if (t >= 1) {
      const doorId = anim.doorId;
      delete mesh.userData.doorOpenAnim;
      if (!DOOR_IDS_WITH_OVERLAY_SCENE.has(doorId)) {
        mesh.userData.doorSwingYRad = 0;
        const entry = doorFloatEntries.find((e) => e.mesh === mesh);
        if (entry) entry.freezeForOpen = false;
        syncDoorRotationFromLayoutSpec(mesh);
        return;
      }
      mesh.userData.doorSwingYRad = DOOR_OPEN_SWING_RAD;
      beginFadeAndSwitchScene(mesh, doorId);
    }
  });

  modelFloatEntries.forEach((entry) => {
    const y =
      entry.baseY + Math.sin(time * 0.85 + entry.phase) * entry.amplitude;
    entry.mesh.position.y = y;
  });

  const hoverTarget =
    doorMotion.hoverScaleMul;
  const lerpK = 1 - Math.exp(-doorMotion.hoverLerpSpeed * dt);

  doorFloatEntries.forEach((entry) => {
    const { mesh, baseY, phase } = entry;
    const isHover = hoveredDoor === mesh;
    const opening = Boolean(mesh.userData.doorOpenAnim);

    if (isHover || entry.freezeForOpen || opening) {
      mesh.position.y = baseY;
    } else {
      const spec = mesh.userData.layoutSpec;
      const worldBand = worldUnitsVisibleHeightAtZ(spec.z);
      const bob =
        Math.sin(time * doorMotion.floatFrequency + phase) *
        doorMotion.floatAmplitude *
        worldBand;
      mesh.position.y = baseY + bob;
    }

    const targetScale = isHover ? hoverTarget : 1;
    entry.displayScale += (targetScale - entry.displayScale) * lerpK;
    mesh.scale.setScalar(entry.displayScale);
  });

  doorMeshes.forEach((mesh) => {
    syncDoorRotationFromLayoutSpec(mesh);
  });

  renderer.render(scene, camera);
}

animate();
