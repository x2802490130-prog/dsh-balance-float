' DeepSeek Harness restart script: kills any dsh already listening on
' PORT, waits for the port to free, then starts a fresh instance through
' launch-dsh.vbs (hidden window, opens the browser when ready).
'
' Use this when the running instance is stale — e.g. right after installing
' or upgrading plugins, since plugins only load at boot.
'
' Launch (double-click the icon) stays safe: it never kills a running
' session. Restart is the explicit "clean up and start fresh" entry point.
Option Explicit

Const PORT = 3080

Dim fso, shell, wshExec, text, lines, line, tokens, pid, url, i

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

url = "http://127.0.0.1:" & PORT & "/"

' 1) Find and kill any existing listener on PORT (netstat lookup, hidden).
Set wshExec = shell.Exec("cmd /c netstat -ano -p tcp")
text = wshExec.StdOut.ReadAll
For Each line In Split(text, vbCrLf)
  If InStr(line, ":" & PORT & " ") > 0 And InStr(line, "LISTENING") > 0 Then
    tokens = Split(Trim(line), " ")
    pid = tokens(UBound(tokens))
    shell.Run "taskkill /PID " & pid & " /T /F", 0, True
    Exit For
  End If
Next

' 2) Wait (up to 20s) for the port to free up.
For i = 1 To 100
  If Not HttpOk(url) Then Exit For
  WScript.Sleep 200
Next

' 3) Start fresh via the hidden launcher next to this file.
shell.Run "wscript.exe """ & fso.GetParentFolderName(WScript.ScriptFullName) & "\launch-dsh.vbs""", 0, False

Function HttpOk(u)
  Dim x
  On Error Resume Next
  Set x = CreateObject("MSXML2.XMLHTTP")
  x.Open "GET", u, False
  x.Send
  If Err.Number = 0 And x.Status = 200 Then HttpOk = True Else HttpOk = False
  On Error GoTo 0
End Function
