' DeepSeek Harness hidden launcher for Windows (no console windows flash).
' Usage:
'   1) Adjust PORT below if your dsh web listens elsewhere.
'   2) Create a desktop shortcut: target = C:\Windows\System32\wscript.exe,
'      arguments = "<full path to this file>", icon = anything you like
'      (see windows/README.md for how to set the icon).
'   3) Or simply double-click launch-dsh.bat.
'
' All file content is ASCII on purpose: cscript reads ANSI/GBK and
' non-ASCII paths in the script itself are a common source of breakage.
Option Explicit

Const PORT = 3080
Const WAIT_SECS = 40
' 绑定地址：默认仅本机(127.0.0.1)。想让手机/平板在局域网访问，改为 "0.0.0.0"
' 并放行防火墙：netsh advfirewall firewall add rule name="DSH Web" dir=in action=allow protocol=TCP localport=3080
Const HOST = "127.0.0.1"
' 快照工具路径（留空 "" = 禁用启动失败自动回退；填绝对路径如 "D:\\tools\\snapshot-tool.mjs"）
Const SNAP_TOOL = ""

Dim fso, shell, q, nodeExe, dshBin, url, logPath, cmdLine, i

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
q = Chr(34)

nodeExe = FindNode()
If nodeExe = "" Then
  WScript.Echo "找不到 node.exe。请先安装 Node.js（nodejs.org）。"
  WScript.Quit 1
End If

' dsh CLI lives in the npm global prefix (%APPDATA%\npm).
dshBin = shell.ExpandEnvironmentStrings("%APPDATA%") & "\npm\node_modules\@deepseek-ai\dsh\lib\bin.js"
If Not fso.FileExists(dshBin) Then
  WScript.Echo "找不到 dsh（" & dshBin & "）。请先执行：npm install -g @deepseek-ai/dsh"
  WScript.Quit 1
End If

url = "http://127.0.0.1:" & PORT & "/"
logPath = shell.ExpandEnvironmentStrings("%TEMP%") & "\dsh-web.log"

' Already running? Just open the browser tab and leave.
If HttpOk(url) Then
  shell.Run url, 1, False
  WScript.Quit 0
End If

' Hidden start (window style 0), output to log.
' The whole command is wrapped in one outer quote pair so cmd.exe parses
' the two quoted paths correctly (verified against cmd /c semantics).
cmdLine = "cmd /c " & q & q & nodeExe & q & " " & q & dshBin & q & " web --host " & HOST & " > " & q & logPath & q & " 2>&1" & q
shell.Run cmdLine, 0, False

' Wait for the port (up to WAIT_SECS seconds).
For i = 1 To WAIT_SECS * 5
  If HttpOk(url) Then Exit For
  WScript.Sleep 200
Next

' Boot failed? If SNAP_TOOL is configured, roll back to the last-good snapshot and retry once.
If Not HttpOk(url) And SNAP_TOOL <> "" Then
  shell.Run q & nodeExe & q & " " & q & SNAP_TOOL & q & " rollback", 0, True
  shell.Run cmdLine, 0, False
  For i = 1 To WAIT_SECS * 5
    If HttpOk(url) Then Exit For
    WScript.Sleep 200
  Next
End If

shell.Run url, 1, False

Function HttpOk(u)
  Dim x
  On Error Resume Next
  Set x = CreateObject("MSXML2.XMLHTTP")
  x.Open "GET", u, False
  x.Send
  If Err.Number = 0 And x.Status = 200 Then HttpOk = True Else HttpOk = False
  On Error GoTo 0
End Function

Function FindNode()
  Dim candidates, c
  candidates = Array( _
    shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe", _
    shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\nodejs\node.exe", _
    shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\nodejs\node.exe" _
  )
  For Each c In candidates
    If fso.FileExists(c) Then FindNode = c : Exit Function
  Next
  FindNode = ""
End Function
