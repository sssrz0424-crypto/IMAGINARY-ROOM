import { defineConfig } from "vite";

/** GitHub Pages 项目站：https://<user>.github.io/IMAGINARY-ROOM/ */
const GITHUB_PAGES_BASE = "/IMAGINARY-ROOM/";

export default defineConfig(({ command }) => ({
  base: process.env.GITHUB_PAGES === "true" || command === "build"
    ? GITHUB_PAGES_BASE
    : "/",
}));
