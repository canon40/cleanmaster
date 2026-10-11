# ACTIVE AGENT MODE: fable

**Title:** Fable 오케스트레이션
**Updated:** 2026-10-11T14:48:11.9147615+09:00
**Reason:** keyword score: 청소 분야를 진행 절차로 변경 코딩 branch:main
**Repo:** D:/@code/cleanmaster-one

## Instructions for the assistant
Follow: C:\Users\hymin\.cursor\agent-stack\modes\fable.md

To auto-switch for a new task:
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.cursor\agent-stack\select-mode.ps1" -Hint "<task>" -Apply

Announce: MODE_SWITCH: fable

## Pipeline order
1. fable
2. orca
3. merge
