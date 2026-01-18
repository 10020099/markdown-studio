# Markdown Studio Pro

Markdown Studio Pro 是一个基于 **Electron + Node.js** 的专业 Markdown 编辑器，提供实时预览、语法高亮与多主题等特性，具有现代化的跨平台体验。

## ✨ 特性

- 🎨 多种主题自由切换（暗黑、明亮、彩虹、游戏）
- ⚡ 实时渲染 Markdown 内容
- 📝 自动保存与文件管理
- 📊 字数和字符统计
- 💾 支持拖拽打开文件
- 🖨️ 导出 PDF 文件
- 📷 OCR 图片文字识别（支持中文+英文）
- ✨ 轻量级动画与友好的界面
- 🔍 可调节字体大小
- 📱 响应式布局设计
- 🎯 可拖拽调整编辑器/预览区域大小

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **Node.js** - JavaScript 运行时
- **Marked.js** - Markdown 解析库
- **Tesseract.js** - OCR 文字识别引擎
- **HTML5 + CSS3** - 现代化界面
- **JavaScript ES6+** - 应用逻辑

## 📦 安装

### 前置要求

- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/10020099/markdown-studio.git
   cd markdown-studio
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

## 🚀 使用

### 开发模式

直接运行应用（带开发者工具）：

```bash
npm run dev
```

或正常启动：

```bash
npm start
```

### 构建打包

构建适用于当前平台的可执行文件：

```bash
npm run build
```

构建 Windows 版本：

```bash
npm run build:win
```

构建 macOS 版本：

```bash
npm run build:mac
```

构建 Linux 版本：

```bash
npm run build:linux
```

打包后的文件将输出到 `dist` 目录。

## 📖 功能说明

### 文件操作

- **打开文件**: `Ctrl/Cmd + O` 或点击工具栏 "📁 打开" 按钮
- **保存文件**: `Ctrl/Cmd + S` 或点击工具栏 "💾 保存" 按钮
- **另存为**: `Ctrl/Cmd + Shift + S` 或点击工具栏 "📝 另存为" 按钮
- **导出 PDF**: `Ctrl/Cmd + P` 或点击工具栏 "📄 导出PDF" 按钮

### 主题切换

通过菜单栏 "🎨 主题" 可以切换以下主题：
- 🌙 暗黑主题（默认）
- ☀️ 明亮主题
- 🌈 彩虹主题
- 🎮 游戏主题

### 视图调整

- **放大字体**: `Ctrl/Cmd + +`
- **缩小字体**: `Ctrl/Cmd + -`
- **重置字体**: `Ctrl/Cmd + 0`
- **全屏模式**: `F11`
- **开发者工具**: `F12`

### 工具功能

- **📊 统计信息**: 查看文档的字数、字符数、行数、段落数等统计信息
- **🔧 设置**: 配置自动保存等选项
- **💾 自动保存**: 每 60 秒自动保存当前文档（需先保存过文件）
- **📷 OCR识别**: 从图片中识别文字并插入到编辑器（支持中文简体+英文）
- **⌨️ 快捷键**: 查看所有可用的快捷键
- **❓ 关于**: 查看应用版本和技术信息

## 💡 特别说明

- **字体**: 建议安装 JetBrains Mono 或其他等宽字体以获得最佳编辑体验
- **PDF 导出**: 使用 Electron 的 printToPDF API，中文支持需要系统字体支持
- **OCR 功能**: 已集成 Tesseract.js，支持中文简体+英文识别，详见 [OCR_GUIDE.md](OCR_GUIDE.md)

## 📁 项目结构

```
markdown-studio/
├── main.js              # Electron 主进程
├── renderer.js          # 渲染进程（应用逻辑）
├── index.html           # 主界面 HTML
├── styles.css           # 样式文件
├── package.json         # 项目配置
├── mca.ico             # 应用图标
└── README.md           # 项目说明（本文件）
```

## 🔧 开发说明

### 添加新功能

1. **主进程功能** (main.js): 处理文件系统、菜单、窗口管理等
2. **渲染进程功能** (renderer.js): 处理 UI 交互、Markdown 渲染等
3. **样式定制** (styles.css): 修改界面样式和主题

### IPC 通信

主进程和渲染进程通过 IPC（进程间通信）交互：

```javascript
// 主进程发送消息
mainWindow.webContents.send('event-name', data);

// 渲染进程接收消息
ipcRenderer.on('event-name', (event, data) => {
    // 处理逻辑
});

// 渲染进程发送消息
ipcRenderer.send('event-name', data);

// 主进程接收消息
ipcMain.on('event-name', (event, data) => {
    // 处理逻辑
});
```

## 🐛 已知问题

- OCR 功能暂未实现，需要集成第三方库
- PDF 导出的中文字体可能需要系统支持
- 大文件（>10MB）编辑可能会有性能问题

## 🗺️ 未来计划

- [ ] 集成 Tesseract.js 实现 OCR 功能
- [ ] 添加 Markdown 语法提示和自动补全
- [ ] 支持多标签页编辑
- [ ] 添加 Git 集成
- [ ] 支持插件系统
- [ ] 云同步功能
- [ ] 协作编辑功能

## 📝 更新记录

### v2.1.0 (2025-01-XX)
- 🎉 首个正式版本发布
- ✨ 完整的 Markdown 编辑功能
- 🎨 4种精美主题
- ⚡ 实时预览和语法高亮
- 📷 集成 Tesseract.js OCR 功能（支持中文+英文）
- 📦 支持跨平台打包
- 💾 自动保存功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

本项目基于 MIT License 发布，详情见 [LICENSE](LICENSE) 文件。

## 💬 联系方式

- GitHub Issues: [提交问题](https://github.com/10020099/markdown-studio/issues)
- Email: support@markdownstudio.com

---

**感谢使用 Markdown Studio Pro！** ✨