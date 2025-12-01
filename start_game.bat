@echo off
REM 启动像素幸存者 - Windows

REM 切换到当前批处理所在目录（项目根目录）
cd /d %~dp0

REM 使用系统默认浏览器打开 index.html
start "" "index.html"

REM 立即退出窗口（可按需要保留窗口）
exit



