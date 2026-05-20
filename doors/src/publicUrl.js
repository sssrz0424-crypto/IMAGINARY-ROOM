/** 静态资源路径（兼容 GitHub Pages 子路径部署） */
export function publicUrl(path) {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  const base = import.meta.env.BASE_URL;
  return `${base}${normalized}`;
}
