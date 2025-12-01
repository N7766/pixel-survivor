#!/bin/bash

# 获取脚本所在目录并进入
cd "$(dirname "$0")"

# 定义端口
PORT=8001
# 每次启动生成一个时间戳，用来绕过缓存
TIMESTAMP=$(date +%s)
URL="http://localhost:$PORT/index.html?t=$TIMESTAMP"

# 检测 Python 环境
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "错误: 未找到 Python 环境。"
    echo "请安装 Python 3 后重试。"
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

echo "========================================"
echo "正在启动像素幸存者本地服务器..."
echo "服务器地址: $URL"
echo "请保持此终端窗口开启，关闭它将停止游戏。"
echo "========================================"

# 根据系统环境延迟打开浏览器
(
    sleep 2
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$URL"
    elif command -v xdg-open &>/dev/null; then
        xdg-open "$URL"
    else
        echo "无法自动打开浏览器，请手动访问: $URL"
    fi
) &

# 前台启动服务器
"$PYTHON_CMD" -m http.server "$PORT"
