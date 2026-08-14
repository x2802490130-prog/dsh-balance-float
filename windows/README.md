# Windows 启动 / 停止脚本

可选组件：在 Windows 上以**完全无黑窗**的方式启动 / 停止 DSH Web，并打开浏览器。

## 文件

| 文件 | 作用 |
| --- | --- |
| `launch-dsh.vbs` | 隐藏窗口启动 dsh web（自动找 node.exe / dsh，输出日志到 `%TEMP%\dsh-web.log`，就绪后打开浏览器） |
| `stop-dsh.vbs` | 通过 netstat 找到监听 3080 端口的进程并 taskkill（全隐藏） |
| `launch-dsh.bat` | 双击用的转发器（注意：双击 .bat 本身会闪一下 cmd 黑窗，属 .bat 固有行为） |

> 全部为纯 ASCII 编码（cscript 按 ANSI/GBK 读取脚本，中文路径会导致脚本自身损坏）。

## 用法：桌面快捷方式（推荐，完全无窗口）

1. 右键桌面 → 新建 → 快捷方式
2. 目标填：`C:\Windows\System32\wscript.exe`
3. 参数填：`"D:\path\to\dsh-balance-float\windows\launch-dsh.vbs"`（换成你的实际路径）
4. 下一步 → 命名 → 完成

### 设置图标

1. 准备好一个 `.ico` 文件（可用任意 16~256px 多尺寸 ICO）
2. 右键快捷方式 → 属性 → 快捷方式 → 更改图标 → 浏览选择你的 `.ico`
3. 若桌面图标未刷新，按 F5 或注销重登

> 本仓库不附带角色图标：原项目使用的鲸鱼娘图标源自 Pixiv 作品
> [147822486「誓死践行开源精神」](https://www.pixiv.net/artworks/147822486)，
> 版权归原画师所有，请勿随仓库再分发。个人使用请自行从 Pixiv 下载并按
> 上述步骤设置；公开分发请替换为自有图标。

## 修改端口

如果你的 dsh web 不在 3080 端口，编辑两个 .vbs 顶部的 `Const PORT = 3080`。

## 常见问题

- **启动后浏览器打开但页面打不开**：看 `%TEMP%\dsh-web.log` 日志；确认已 `npm install -g @deepseek-ai/dsh`。
- **点击图标没反应**：确认参数里的 .vbs 路径正确且文件存在。
- **想彻底无窗口退出**：直接在网页右上角悬浮窗点 ⏻（或按 Y），无需本脚本。
