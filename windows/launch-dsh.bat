@echo off
rem Hidden launcher: starts dsh web with no console window.
rem Note: double-clicking this .bat itself briefly flashes a cmd window
rem (unavoidable for .bat files). For a completely silent start, create a
rem shortcut to wscript.exe pointing at launch-dsh.vbs instead.
start "" wscript.exe "%~dp0launch-dsh.vbs"
exit
