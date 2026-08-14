# dsh-balance-float

DeepSeek Harness（DSH）Web 插件：在网页右上角显示一个悬浮窗，实时显示 DeepSeek 模型账户余额，支持手动刷新与一键优雅退出（Y/N 快捷键确认）。

## 环境要求

- 已安装 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) CLI：`npm install -g @deepseek-ai/dsh`
- 已配置 DeepSeek API Key（用于余额查询；未配置时悬浮窗显示「获取失败」红点，不影响其他功能，Key 配置方式见下文）

## 功能

- **实时余额**：悬浮窗每 60 秒自动刷新，展示总余额 / 赠送 / 充值明细
- **手动刷新**：点击 ↻ 按钮立即刷新
- **一键退出**：点击 ⏻ 弹出确认框，按键盘 **Y** 确认退出（关闭本地服务与网页），**N / Esc** 取消
- **退出即关闭**：退出后本地 DSH 服务与 http://127.0.0.1:3080 网页一并关闭

## 安装

### 方式一：GitHub 直装

```bash
dsh plugin --profile web add github:x2802490130-prog/dsh-balance-float
```

> 本插件为纯 JavaScript 发布（无构建步骤），git 直装即可使用，无需 pnpm 构建许可（见官方 [publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/HEAD/docs/user/develop/basic/publish.md)）。

### 方式二：npm 发布后

```bash
dsh plugin --profile web add @dsh-external/dsh-balance-float
```

### 方式二：本地链接（开发 / 尝鲜）

```bash
dsh plugin --profile web add link:/path/to/dsh-balance-float
```

安装后重启 dsh（或硬刷新网页 Ctrl+F5），右上角即出现悬浮窗。

## 使用

| 操作 | 效果 |
| --- | --- |
| 点击悬浮窗主体 | 展开余额明细（总 / 赠送 / 充值 / 更新时间） |
| 点击 ↻ | 立即刷新余额 |
| 点击 ⏻ | 弹出退出确认框 |
| 键盘 **Y** | 确认退出（本地服务与网页一并关闭） |
| 键盘 **N / Esc** | 取消退出 |
| 再点 ⏻ | 关闭确认框 |

## 配置

插件读取 DeepSeek API Key，查找顺序：

1. 环境变量 `DEEPSEEK_API_KEY`
2. `$DSH_HOME/.credentials.yaml`
3. `%USERPROFILE%/.dsh/.credentials.yaml`（Windows）
4. `$HOME/.dsh/.credentials.yaml`

credentials 文件格式：

```yaml
DEEPSEEK_API_KEY: sk-xxxx
```

> API Key 仅用于服务端请求，永远不会出现在网页响应中。

## HTTP 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/dsh-balance` | 余额查询（60 秒缓存） |
| POST | `/api/dsh-exit` | 优雅退出：SIGINT 关闭 dsh，6 秒兜底强杀 |

两个接口都只挂在本地 dsh 服务上，不对外暴露。

## 开发与测试

```bash
npm i -D jsdom   # 可选：测试依赖
node test.mjs    # 回归测试（宿主路由 + jsdom 客户端交互，离线可跑）
```

## 目录结构

```
lib/index.js        宿主（HTTP 路由：余额 / 退出）
client/client.js    客户端（悬浮窗 UI 与交互）
cordis.patch.yml    bundle 补丁
test.mjs            回归测试
windows/            可选：Windows 隐藏窗口启动 / 停止脚本
```

## License

[MIT](./LICENSE)
