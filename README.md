# IMAGINARY ROOM

毕设交互作品「假想房间」——基于 Three.js + Vite 的 3D 门廊场景。

## 在线访问

部署成功后地址为：

**https://sssrz0424-crypto.github.io/IMAGINARY-ROOM/**

（需先在 GitHub 仓库 Settings → Pages 中选择 **GitHub Actions** 作为 Source。）

## 本地运行

```bash
cd doors
npm install
npm run dev
```

浏览器打开终端提示的本地地址（一般为 `http://localhost:5173`）。

## 项目结构

| 路径 | 说明 |
|------|------|
| `doors/` | Vite 前端工程（源码、素材、构建配置） |
| `doors/src/` | Three.js 场景与交互逻辑 |
| `doors/public/` | 不经打包、按路径引用的静态资源（如 `white_gallery/`） |
| `doors/assets/` | 由 Vite 打包的贴图与音频 |

## 发布说明

推送 `main` 分支后，`.github/workflows/deploy-pages.yml` 会自动构建 `doors` 并发布到 GitHub Pages。

**注意：** 不要把 `cursor/` 文件夹提交到仓库；那是编辑器程序，体积巨大且与作品无关。
