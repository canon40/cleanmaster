@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [FLOOR LAB] 네이버 블로그 글을 불러옵니다...
node scripts\fetch-blog.js
if errorlevel 1 (
  echo 실패했습니다. Node.js 18 이상이 필요합니다.
  pause
  exit /b 1
)
echo 완료: blog.json / blogimg 가 갱신되었습니다.
pause
