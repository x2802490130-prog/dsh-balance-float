# Windows 启动 / 停止脚本

可选组件：在 Windows 上以**完全无黑窗**的方式启动 / 停止 DSH Web，并打开浏览器。

## 文件

| 文件 | 作用 |
| --- | --- |
| `launch-dsh.vbs` | 隐藏窗口启动 dsh web（自动找 node.exe / dsh，输出日志到 `%TEMP%\dsh-web.log`，就绪后打开浏览器）；已在运行则只打开浏览器，**绝不杀会话** |
| `restart-dsh.vbs` | **重启**：先杀掉占用 3080 的旧进程，等端口释放，再走 launch-dsh.vbs 无窗启动（装/升插件后必用） |
| `stop-dsh.vbs` | 通过 netstat 找到监听 3080 端口的进程并 taskkill（全隐藏） |
| `launch-dsh.bat` | 双击用的转发器（注意：双击 .bat 本身会闪一下 cmd 黑窗，属 .bat 固有行为） |

> 全部为纯 ASCII 编码（cscript 按 ANSI/GBK 读取脚本，中文路径会导致脚本自身损坏）。

## 用法：桌面快捷方式（推荐，完全无窗口）

1. 右键桌面 → 新建 → 快捷方式
2. 目标填：`C:\Windows\System32\wscript.exe`
3. 参数填：`"D:\path\to\dsh-balance-float\windows\launch-dsh.vbs"`（换成你的实际路径）
4. 下一步 → 命名 → 完成

### 设置图标

1. 右键快捷方式 → 属性 → 快捷方式 → 更改图标 → 浏览选择本仓库的 `windows\icon\dsh.ico`（默认原创鲸鱼图标，可放心使用）
2. 若桌面图标未刷新，按 F5 或注销重登

**想换图标？把你的 `.ico` 存为 `windows\icon\custom.ico`**（该文件被 git 忽略，拉更新永不覆盖；同名替换 dsh.ico 也可但会被仓库更新覆盖）。
图标版权注意事项（如不要使用 DeepSeek 官方 logo、Pixiv 画师作品需授权等）见 [icon/README.md](./icon/README.md)。

## 启动失败自动回退（可选）

把 `launch-dsh.vbs` 顶部的 `SNAP_TOOL` 填成快照工具路径（如 `"D:\\tools\\snapshot-tool.mjs"`），启动失败时会自动回退到上次良好快照并重试一次。留空则禁用。

## 修改端口

如果你的 dsh web 不在 3080 端口，编辑两个 .vbs 顶部的 `Const PORT = 3080`。

## 常见问题

- **装/升级插件后不生效**：插件只在启动时加载。双击 `restart-dsh.vbs`（先杀旧进程再启动），不要只用启动图标——它检测到端口被占会只开浏览器而不换新进程。
- **启动后浏览器打开但页面打不开**：看 `%TEMP%\dsh-web.log` 日志；确认已 `npm install -g @deepseek-ai/dsh`。
- **点击图标没反应**：确认参数里的 .vbs 路径正确且文件存在。
- **想彻底无窗口退出**：直接在网页右上角悬浮窗点 ⏻（或按 Y），无需本脚本。
