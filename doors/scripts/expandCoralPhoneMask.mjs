/**
 * 扩大手机框 PNG 内透明取景孔：从画面中心 flood-fill 找内孔，再向内侵蚀边框。
 * 用法：node scripts/expandCoralPhoneMask.mjs [expandPx]
 */
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const expandPx = Math.max(1, Number(process.argv[2]) || 56);

const inPath = path.join(
  __dirname,
  "../assets/coral_door_scene/phone_frame/phone_frame_mask.png"
);
const outPath = inPath;

function loadPng(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(new PNG())
      .on("parsed", function onParsed() {
        resolve(this);
      })
      .on("error", reject);
  });
}

function writePng(filePath, png) {
  return new Promise((resolve, reject) => {
    png
      .pack()
      .pipe(fs.createWriteStream(filePath))
      .on("finish", resolve)
      .on("error", reject);
  });
}

function alphaAt(data, w, x, y) {
  return data[(y * w + x) * 4 + 3];
}

function isTransparent(data, w, x, y, threshold = 32) {
  return alphaAt(data, w, x, y) < threshold;
}

function floodInteriorHole(data, w, h) {
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const interior = new Uint8Array(w * h);
  if (!isTransparent(data, w, cx, cy)) {
    console.warn("[expandCoralPhoneMask] 中心非透明，改从最近透明像素起步");
    let found = false;
    for (let r = 1; r < Math.max(w, h) && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          if (isTransparent(data, w, x, y)) {
            found = true;
            seedFlood(x, y);
          }
        }
      }
    }
    if (!interior.some(Boolean)) return interior;
  } else {
    seedFlood(cx, cy);
  }

  function seedFlood(sx, sy) {
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      const i = y * w + x;
      if (interior[i]) continue;
      if (!isTransparent(data, w, x, y)) continue;
      interior[i] = 1;
      if (x > 0) stack.push([x - 1, y]);
      if (x < w - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < h - 1) stack.push([x, y + 1]);
    }
  }

  return interior;
}

function expandHole(data, w, h, interior, iterations) {
  const nextInterior = new Uint8Array(interior);
  for (let n = 0; n < iterations; n++) {
    let changed = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (nextInterior[i]) continue;
        if (isTransparent(data, w, x, y)) {
          nextInterior[i] = 1;
          continue;
        }
        const touchesHole =
          (x > 0 && nextInterior[i - 1]) ||
          (x < w - 1 && nextInterior[i + 1]) ||
          (y > 0 && nextInterior[i - w]) ||
          (y < h - 1 && nextInterior[i + w]);
        if (touchesHole) {
          nextInterior[i] = 1;
          const o = i * 4;
          data[o + 3] = 0;
          changed++;
        }
      }
    }
    if (!changed) break;
  }
  return nextInterior;
}

const png = await loadPng(inPath);
const { width: w, height: h, data } = png;
const interior = floodInteriorHole(data, w, h);
const holePixels = interior.reduce((a, v) => a + v, 0);
if (holePixels === 0) {
  console.error("[expandCoralPhoneMask] 未找到内孔，跳过写入");
  process.exit(1);
}
expandHole(data, w, h, interior, expandPx);
await writePng(outPath, png);
console.log(
  `[expandCoralPhoneMask] 已扩大取景孔约 ${expandPx}px，写入 ${outPath}（原孔约 ${holePixels} 像素）`
);
