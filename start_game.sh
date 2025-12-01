#!/usr/bin/env bash
# 启动像素幸存者 - Linux / macOS

# 切到脚本所在目录（项目根目录）
cd "$(dirname "$0")"

UNAME="$(uname)"

if [ "$UNAME" = "Darwin" ]; then
  # macOS：使用系统默认浏览器打开
  open "index.html"
else
  # Linux：使用桌面环境默认浏览器打开
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "index.html" >/dev/null 2>&1 &
  else
    echo "请手动用浏览器打开 index.html"
  fi
fi



