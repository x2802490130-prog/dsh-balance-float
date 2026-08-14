@echo off
rem Restart dsh: kills the stale process, then starts fresh (hidden).
rem Prefer the .vbs directly (no console flash); this .bat is a convenience.
start "" wscript.exe "%~dp0restart-dsh.vbs"
exit
