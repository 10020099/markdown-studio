# 🛠️ Markdown Studio Pro - 开发指南

## 📋 目录

- [项目概述](#项目概述)
- [技术架构](#技术架构)
- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [核心模块说明](#核心模块说明)
- [开发工作流](#开发工作流)
- [添加新功能](#添加新功能)
- [调试技巧](#调试技巧)
- [性能优化](#性能优化)
- [打包发布](#打包发布)
- [贡献指南](#贡献指南)

---

## 项目概述

Markdown Studio Pro 是一个基于 Electron + Node.js 的跨平台 Markdown 编辑器，提供实时预览、多主题切换、语法高亮等功能。

### 技术栈

- **前端**: HTML5, CSS3, JavaScript ES6+
- **框架**: Electron 28.x
- **Markdown 解析**: Marked.js
- **打包工具**: electron-builder

### 核心特性

- 实时 Markdown 预览
- 4 种主题切换
- 语法高亮
- 自动保存
- PDF 导出
- 字数统计
- 快捷键支持

---

## 技术架构

### Electron 双进程架构

```
┌─────────────────────────────────────┐
│         Main Process (main.js)      │
│  - 窗口管理                          │
│  - 菜单系统                          │
│  - 文件系统操作                      │
│  - IPC 通信                          │
└──────────────┬──────────────────────┘
               │ IPC
               │
┌──────────────▼──────────────────────┐
│    Renderer Process (renderer.js)   │
│  - UI 渲染                           │
│  - 用户交互                          │
│  - Markdown 解析                     │
│  - 事件处理                          │
└─────────────────────────────────────┘
```

### 数据流

```
用户输入 → 编辑器 → 延迟更新 → Markdown 解析 → HTML 渲染 → 预览区域
                    ↓
                字数统计
                    ↓
                语法高亮
```

---

## 开发环境设置

### 1. 安装 Node.js

确保安装 Node.js 16.x 或更高版本：

```bash
node --version  # 应该显示 v16.x.x 或更高
npm --version   # 应该显示 8.x.x 或更高
```

### 2. 克隆项目

```bash
git clone https://github.com/10020099/markdown-studio.git
cd markdown-studio
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发模式

```bash
npm run dev
```

---

## 项目结构

```
markdown-studio/
├── main.js              # Electron 主进程
├── renderer.js          # 渲染进程（UI 逻辑）
├── index.html           # 主界面结构
├── styles.css           # 样式表
├── package.json         # 项目配置
├── mca.ico             # 应用图标
├── node_modules/       # 依赖包
├── README.md           # 项目说明
├── QUICKSTART.md       # 快速开始
├── NODEJS_SETUP.md     # 安装指南
└── DEVELOPMENT.md      # 开发指南（本文件）
```

---

## 核心模块说明

### main.js - 主进程

**职责**:
- 创建和管理应用窗口
- 处理系统级操作（文件对话框、菜单等）
- 管理应用生命周期
- IPC 通信服务端

**关键函数**:

```javascript
createWindow()        // 创建主窗口
createMenu()          // 创建应用菜单
openFile()            // 打开文件对话框
saveFile()            // 保存文件
exportToPDF()         // 导出 PDF
```

### renderer.js - 渲染进程

**职责**:
- 处理用户界面交互
- Markdown 解析和渲染
- 编辑器状态管理
- 主题切换
- 实时预览更新

**关键函数**:

```javascript
initializeApp()       // 初始化应用
updatePreview()       // 更新预览
updateWordCount()     // 更新字数统计
changeTheme()         // 切换主题
showModal()           // 显示模态对话框
```

### index.html - 界面结构

**主要区域**:
- 启动画面 (`#splash-screen`)
- 工具栏 (`.toolbar`)
- 编辑器面板 (`.editor-panel`)
- 预览面板 (`.preview-panel`)
- 状态栏 (`.status-bar`)

### styles.css - 样式系统

**样式组织**:
- 全局样式
- 启动画面样式
- 工具栏样式
- 编辑器样式
- 预览区域样式
- 主题样式
- 动画效果

---

## 开发工作流

### 1. 启动开发服务器

```bash
npm run dev
```

这会启动应用并打开开发者工具。

### 2. 实时调试

- 按 `F12` 打开开发者工具
- 使用 Console 查看日志
- 使用 Elements 检查 DOM
- 使用 Network 监控请求

### 3. 热重载

修改代码后，按 `Ctrl+R` 或 `Cmd+R` 重新加载应用。

### 4. 代码规范

- 使用 ES6+ 语法
- 函数命名使用驼峰命名法
- 添加必要的注释
- 保持代码简洁清晰

---

## 添加新功能

### 示例：添加一个新的菜单项

#### 1. 在 main.js 中添加菜单项

```javascript
// 在 createMenu() 函数中
{
    label: '🎯 新功能',
    click: () => newFeature()
}
```

#### 2. 实现功能函数

```javascript
function newFeature() {
    mainWindow.webContents.send('new-feature');
}
```

#### 3. 在 renderer.js 中处理

```javascript
ipcRenderer.on('new-feature', () => {
    // 实现具体功能
    console.log('新功能被触发');
});
```

### 示例：添加新主题

#### 1. 在 styles.css 中定义主题

```css
body.theme-custom {
    background-color: #your-color;
}

body.theme-custom .toolbar {
    background-color: #your-color;
}

/* 更多样式... */
```

#### 2. 在 renderer.js 中添加主题选项

```javascript
function changeTheme(themeName) {
    currentTheme = themeName;
    document.body.className = `theme-${themeName}`;
    showNotification(`🎨 已切换到 ${themeName} 主题！`);
}
```

#### 3. 在 main.js 菜单中添加选项

```javascript
{
    label: '🎨 自定义主题',
    click: () => changeTheme('custom')
}
```

---

## 调试技巧

### 1. 主进程调试

在 main.js 中添加日志：

```javascript
console.log('主进程日志:', data);
```

查看终端输出。

### 2. 渲染进程调试

在 renderer.js 中添加日志：

```javascript
console.log('渲染进程日志:', data);
```

在开发者工具的 Console 中查看。

### 3. IPC 通信调试

```javascript
// 主进程
ipcMain.on('event-name', (event, data) => {
    console.log('收到消息:', data);
});

// 渲染进程
ipcRenderer.send('event-name', data);
console.log('发送消息:', data);
```

### 4. 断点调试

在开发者工具中：
1. 打开 Sources 标签
2. 找到对应的 JS 文件
3. 点击行号设置断点
4. 触发功能，程序会在断点处暂停

### 5. 性能分析

使用 Performance 标签：
1. 点击录制按钮
2. 执行操作
3. 停止录制
4. 分析性能瓶颈

---

## 性能优化

### 1. 延迟更新

避免频繁更新预览：

```javascript
function scheduleUpdate() {
    if (updateTimer) {
        clearTimeout(updateTimer);
    }
    updateTimer = setTimeout(() => {
        updatePreview();
    }, 500); // 500ms 延迟
}
```

### 2. 大文件处理

对大文件禁用语法高亮：

```javascript
const text = editor.value;
if (text.length < 10000) {
    applySyntaxHighlighting();
}
```

### 3. 内存管理

定期清理不需要的数据：

```javascript
// 清理旧的事件监听器
element.removeEventListener('event', handler);

// 清理定时器
clearInterval(timer);
clearTimeout(timeout);
```

### 4. DOM 操作优化

批量更新 DOM：

```javascript
// 不好的做法
for (let i = 0; i < 1000; i++) {
    element.innerHTML += '<div>item</div>';
}

// 好的做法
let html = '';
for (let i = 0; i < 1000; i++) {
    html += '<div>item</div>';
}
element.innerHTML = html;
```

---

## 打包发布

### 1. 准备打包

确保所有功能正常：

```bash
npm start  # 测试应用
```

### 2. 打包当前平台

```bash
npm run build
```

### 3. 打包特定平台

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### 4. 打包配置

在 `package.json` 中配置：

```json
{
  "build": {
    "appId": "com.markdownstudio.app",
    "productName": "Markdown Studio Pro",
    "files": [
      "main.js",
      "renderer.js",
      "index.html",
      "styles.css",
      "mca.ico",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "mca.ico"
    }
  }
}
```

### 5. 测试打包结果

在 `dist/` 目录中找到打包文件，安装并测试。

---

## 贡献指南

### 1. Fork 项目

在 GitHub 上 Fork 本项目。

### 2. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 3. 提交更改

```bash
git add .
git commit -m "Add: 添加新功能描述"
```

提交信息格式：
- `Add:` 添加新功能
- `Fix:` 修复 bug
- `Update:` 更新功能
- `Refactor:` 重构代码
- `Docs:` 更新文档

### 4. 推送到 GitHub

```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

在 GitHub 上创建 Pull Request，描述你的更改。

### 代码审查标准

- 代码风格一致
- 添加必要的注释
- 功能完整且无 bug
- 不影响现有功能
- 更新相关文档

---

## 常见开发问题

### Q1: 如何添加新的快捷键？

在 `main.js` 的菜单配置中添加 `accelerator`：

```javascript
{
    label: '新功能',
    accelerator: 'CmdOrCtrl+Shift+N',
    click: () => newFeature()
}
```

### Q2: 如何修改启动画面？

编辑 `index.html` 中的 `#splash-screen` 部分和 `renderer.js` 中的 `showSplashScreen()` 函数。

### Q3: 如何添加新的 Markdown 扩展？

使用 marked.js 的扩展功能：

```javascript
marked.use({
    extensions: [
        {
            name: 'custom',
            level: 'block',
            start(src) { /* ... */ },
            tokenizer(src, tokens) { /* ... */ },
            renderer(token) { /* ... */ }
        }
    ]
});
```

### Q4: 如何优化启动速度？

- 延迟加载非必要模块
- 减少启动时的初始化操作
- 使用异步加载

### Q5: OCR 功能如何工作？

**A**: OCR 功能使用 Tesseract.js 实现：

```javascript
// 初始化 OCR Worker
ocrWorker = await Tesseract.createWorker('chi_sim+eng', 1, {
    logger: (m) => {
        // 显示进度
        if (m.status === 'recognizing text') {
            progressText.textContent = `识别进度: ${Math.round(m.progress * 100)}%`;
        }
    }
});

// 识别图片
const { data: { text } } = await ocrWorker.recognize(filePath);
```

详见 `OCR_GUIDE.md` 获取完整使用指南。

### Q6: 如何添加国际化支持？

**A**: 创建语言文件并在运行时加载：

```javascript
const i18n = {
    'zh-CN': {
        'open': '打开',
        'save': '保存'
    },
    'en-US': {
        'open': 'Open',
        'save': 'Save'
    }
};
```

---

## 测试

### 手动测试清单

- [ ] 文件打开/保存/另存为
- [ ] Markdown 实时预览
- [ ] 主题切换
- [ ] 快捷键功能
- [ ] PDF 导出
- [ ] OCR 图片识别
- [ ] 字数统计
- [ ] 自动保存
- [ ] 窗口大小调整
- [ ] 分隔条拖拽

### 自动化测试（未来计划）

```bash
npm test
```

---

## 资源链接

- **Electron 文档**: https://www.electronjs.org/docs
- **Marked.js 文档**: https://marked.js.org/
- **Node.js 文档**: https://nodejs.org/docs
- **MDN Web 文档**: https://developer.mozilla.org/

---

## 联系方式

- **GitHub Issues**: https://github.com/10020099/markdown-studio/issues
- **Email**: support@markdownstudio.com

---

**祝你开发愉快！** 🚀

如有任何问题，欢迎提交 Issue 或 Pull Request。