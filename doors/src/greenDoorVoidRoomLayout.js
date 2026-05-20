/**
 * 斐波那契球面分布：将各行文字铺在球面上并朝外法线朝向。
 */
export function buildGreenVoidSphereSlots(count = 148, radius = 128) {
  const slots = [];
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const t = count > 1 ? i / (count - 1) : 0;
    const y = 1 - t * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const x = Math.cos(theta) * ring;
    const z = Math.sin(theta) * ring;

    const ry = (Math.atan2(x, z) * 180) / Math.PI;
    const rx = (-Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI;
    const depth = 0.78 + (z + 1) * 0.11;

    slots.push({
      tx: x * radius,
      ty: -y * radius,
      tz: z * radius,
      rx,
      ry,
      rz: 0,
      sx: 0.62 + depth * 0.12,
      sy: 0.62 + depth * 0.12,
      opacity: 0.72 + depth * 0.22,
    });
  }

  return slots;
}

export const GREEN_VOID_SPHERE_ORIGIN = {
  tx: 0,
  ty: 0,
  tz: 0,
  rx: 0,
  ry: 0,
  rz: 0,
  sx: 0.06,
  sy: 0.06,
  opacity: 0,
};
