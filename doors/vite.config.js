import { defineConfig } from "vite";

/** GitHub Pages 项目站：https://<user>.github.io/IMAGINARY-ROOM/ */
const GITHUB_PAGES_BASE = "/IMAGINARY-ROOM/";
/** 从 main 根目录的 docs/ 子路径发布时使用 */
const GITHUB_PAGES_DOCS_BASE = "/IMAGINARY-ROOM/docs/";

function resolveBase() {
  if (process.env.GITHUB_PAGES_DOCS === "true") return GITHUB_PAGES_DOCS_BASE;
  if (process.env.GITHUB_PAGES === "true") return GITHUB_PAGES_BASE;
  return "/";
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? resolveBase() : "/",
}));
