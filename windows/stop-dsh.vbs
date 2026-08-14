' DeepSeek Harness hidden stop script: kills the dsh process that is
' listening on PORT (netstat lookup, then taskkill), all hidden.
' Adjust PORT below if your dsh web listens elsewhere.
Option Explicit

Const PORT = 3080

Dim shell, wshExec, text, lines, line, tokens, pid

Set shell = CreateObject("WScript.Shell")

Set wshExec = shell.Exec("cmd /c netstat -ano -p tcp")
text = wshExec.StdOut.ReadAll
pid = ""

For Each line In Split(text, vbCrLf)
  If InStr(line, ":" & PORT & " ") > 0 And InStr(line, "LISTENING") > 0 Then
    tokens = Split(Trim(line), " ")
    pid = tokens(UBound(tokens))
    Exit For
  End If
Next

If pid = "" Then
  WScript.Echo "No dsh process listening on port " & PORT
  WScript.Quit 0
End If

shell.Run "taskkill /PID " & pid & " /T /F", 0, True
WScript.Echo "Stopped dsh (PID " & pid & ")"
