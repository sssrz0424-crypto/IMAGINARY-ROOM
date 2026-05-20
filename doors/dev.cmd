@echo off
cd /d "%~dp0"
if not exist "node_modules\vite\bin\vite.js" (
  echo 未找到 node_modules，请先在本目录执行依赖安装（需已安装 Node.js）：
  echo   npm install
  pause
  exit /b 1
)
echo 正在启动 Vite（不依赖全局 npm 命令）...
node node_modules\vite\bin\vite.js
