# 🚀 Markdown Studio Pro - Node.js 版本安装和使用指南

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细安装步骤](#详细安装步骤)
- [运行应用](#运行应用)
- [打包发布](#打包发布)
- [常见问题](#常见问题)
- [功能说明](#功能说明)

---

## 系统要求

### 最低配置
- **操作系统**: Windows 10+, macOS 10.13+, Ubuntu 18.04+
- **Node.js**: 16.x 或更高版本
- **内存**: 4GB RAM
- **磁盘空间**: 1GB 可用空间

### 推荐配置
- **操作系统**: Windows 11, macOS 12+, Ubuntu 22.04+
- **Node.js**: 18.x 或 20.x LTS
- **内存**: 8GB RAM
- **磁盘空间**: 2GB 可用空间

---

## 快速开始

### 1. 检查 Node.js 版本

```bash
node --version
# 应该显示 v16.x.x 或更高版本
```

如果没有安装 Node.js，请访问 [nodejs.org](https://nodejs.org/) 下载安装。

### 2. 安装依赖

在项目目录下运行：

```bash
npm install
```

等待依赖安装完成（大约需要 1-2 分钟）。

### 3. 启动应用

```bash
npm start
```

应用将在几秒钟内启动！

---

## 详细安装步骤

### Windows 用户

1. **安装 Node.js**
   - 访问 https://nodejs.org/
   - 下载 LTS 版本（推荐）
   - 运行安装程序，按默认选项安装
   - 重启命令提示符或 PowerShell

2. **验证安装**
   ```cmd
   node --version
   npm --version
   ```

3. **进入项目目录**
   ```cmd
   cd D:\迅雷下载\markdown-studio
   ```

4. **安装项目依赖**
   ```cmd
   npm install
   ```

5. **启动应用**
   ```cmd
   npm start
   ```

### macOS 用户

1. **安装 Node.js**
   
   使用 Homebrew（推荐）：
   ```bash
   brew install node
   ```
   
   或从官网下载安装包：https://nodejs.org/

2. **验证安装**
   ```bash
   node --version
   npm --version
   ```

3. **进入项目目录**
   ```bash
   cd /path/to/markdown-studio
   ```

4. **安装项目依赖**
   ```bash
   npm install
   ```

5. **启动应用**
   ```bash
   npm start
   ```

### Linux 用户

1. **安装 Node.js**
   
   Ubuntu/Debian:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
   
   Fedora:
   ```bash
   sudo dnf install nodejs
   ```

2. **验证安装**
   ```bash
   node --version
   npm --version
   ```

3. **进入项目目录**
   ```bash
   cd /path/to/markdown-studio
   ```

4. **安装项目依赖**
   ```bash
   npm install
   ```

5. **启动应用**
   ```bash
   npm start
   ```

---

## 运行应用

### 开发模式

带开发者工具启动（用于调试）：

```bash
npm run dev
```

### 正常模式

```bash
npm start
```

### 首次启动

1. 应用会显示启动画面（2-3 秒）
2. 自动加载欢迎消息
3. 左侧是编辑器，右侧是实时预览
4. 开始编写你的 Markdown 文档！

---

## 打包发布

### 打包当前平台

```bash
npm run build
```

输出目录：`dist/`

### 打包 Windows 版本

```bash
npm run build:win
```

生成文件：
- `dist/Markdown Studio Pro Setup.exe` (安装程序)
- `dist/win-unpacked/` (免安装版本)

### 打包 macOS 版本

```bash
npm run build:mac
```

生成文件：
- `dist/Markdown Studio Pro.dmg` (磁盘镜像)
- `dist/mac/` (应用包)

### 打包 Linux 版本

```bash
npm run build:linux
```

生成文件：
- `dist/Markdown Studio Pro.AppImage` (AppImage 格式)
- `dist/linux-unpacked/` (解压版本)

### 打包所有平台

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

---

## 常见问题

### Q1: npm install 失败怎么办？

**A**: 尝试以下方法：

1. 清除 npm 缓存：
   ```bash
   npm cache clean --force
   ```

2. 删除 node_modules 和 package-lock.json：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. 使用国内镜像（中国用户）：
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```

### Q2: 启动时报错 "Cannot find module"

**A**: 确保已正确安装依赖：
```bash
npm install
```

### Q3: 应用启动很慢

**A**: 这是正常的，Electron 应用首次启动需要 2-3 秒。后续启动会更快。

### Q4: 打包失败

**A**: 检查以下几点：
1. 确保有足够的磁盘空间（至少 2GB）
2. 关闭杀毒软件（可能会阻止打包）
3. 使用管理员权限运行（Windows）

### Q5: PDF 导出中文显示不正常

**A**: 确保系统安装了中文字体：
- Windows: 默认已安装
- macOS: 默认已安装
- Linux: 安装字体包
  ```bash
  sudo apt-get install fonts-wqy-zenhei
  ```

### Q6: 内存占用太高

**A**: Electron 应用通常占用 150-200MB 内存，这是正常的。如果超过 500MB，请重启应用。

### Q7: 如何卸载？

**A**: 
- Windows: 控制面板 → 程序和功能 → 卸载
- macOS: 将应用拖到废纸篓
- Linux: 删除 AppImage 文件

### Q8: 能否与 Python 版本共存？

**A**: 可以！两个版本完全独立，互不影响。

---

## 功能说明

### 文件操作

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 打开文件 | `Ctrl/Cmd + O` | 打开 Markdown 文件 |
| 保存文件 | `Ctrl/Cmd + S` | 保存当前文档 |
| 另存为 | `Ctrl/Cmd + Shift + S` | 保存到新文件 |
| 导出 PDF | `Ctrl/Cmd + P` | 导出为 PDF 格式 |

### 编辑功能

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 撤销 | `Ctrl/Cmd + Z` | 撤销上一步操作 |
| 重做 | `Ctrl/Cmd + Y` | 重做 |
| 全选 | `Ctrl/Cmd + A` | 选择全部内容 |
| 复制 | `Ctrl/Cmd + C` | 复制选中内容 |
| 粘贴 | `Ctrl/Cmd + V` | 粘贴内容 |
| 剪切 | `Ctrl/Cmd + X` | 剪切选中内容 |

### 视图控制

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 放大字体 | `Ctrl/Cmd + +` | 增大编辑器字体 |
| 缩小字体 | `Ctrl/Cmd + -` | 减小编辑器字体 |
| 重置字体 | `Ctrl/Cmd + 0` | 恢复默认字体大小 |
| 全屏模式 | `F11` | 切换全屏 |
| 开发者工具 | `F12` | 打开调试工具 |

### 主题切换

通过菜单栏 **🎨 主题** 选择：
- 🌙 **暗黑主题** - 深色背景，护眼舒适
- ☀️ **明亮主题** - 浅色背景，清新明亮
- 🌈 **彩虹主题** - 炫彩渐变，个性十足
- 🎮 **游戏主题** - 游戏风格，酷炫动感

### 工具功能

- **📊 统计信息** - 查看字数、字符数、行数、段落数
- **🔧 设置** - 配置自动保存等选项
- **💾 自动保存** - 每 60 秒自动保存（需先保存过文件）
- **🎯 专注模式** - 隐藏工具栏，专注写作（开发中）
- **📷 OCR识别** - 图片文字识别（已集成 Tesseract.js，支持中文+英文）
- **⌨️ 快捷键** - 查看所有快捷键列表
- **❓ 关于** - 查看版本信息

### 特色功能

1. **实时预览** - 编辑时右侧实时显示渲染效果
2. **拖拽调整** - 拖动中间分隔条调整编辑器和预览区域大小
3. **语法高亮** - Markdown 语法自动高亮显示
4. **打字指示器** - 显示当前编辑状态
5. **实时时钟** - 工具栏显示当前时间
6. **通知提示** - 优雅的操作反馈提示

---

## Markdown 语法速查

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体文本**
*斜体文本*
~~删除线~~

- 无序列表
- 列表项

1. 有序列表
2. 列表项

[链接文本](https://example.com)
![图片](image.jpg)

`行内代码`

​```
代码块
​```

> 引用文本

| 表头1 | 表头2 |
|------|------|
| 单元格 | 单元格 |

---
```

---

## 性能优化建议

1. **大文件编辑**
   - 超过 10,000 字符时，语法高亮会自动禁用
   - 建议将大文档拆分为多个小文件

2. **自动保存**
   - 默认 60 秒间隔，可在设置中调整
   - 建议保持启用状态

3. **内存管理**
   - 长时间使用后如果卡顿，重启应用即可
   - 关闭不需要的标签页（未来版本支持）

4. **预览延迟**
   - 默认 500ms 延迟，避免频繁渲染
   - 可在代码中调整 `scheduleUpdate` 函数的延迟时间

---

## 开发者指南

### 项目结构

```
markdown-studio/
├── main.js              # Electron 主进程
├── renderer.js          # 渲染进程（UI 逻辑）
├── index.html           # 主界面
├── styles.css           # 样式表
├── package.json         # 项目配置
├── mca.ico             # 应用图标
└── node_modules/       # 依赖包
```

### 修改界面样式

编辑 `styles.css` 文件，修改对应的 CSS 类。

### 添加新功能

1. **主进程功能**（文件操作、系统交互）
   - 编辑 `main.js`
   - 添加 IPC 事件处理

2. **渲染进程功能**（UI 交互）
   - 编辑 `renderer.js`
   - 添加事件监听器

3. **界面元素**
   - 编辑 `index.html`
   - 在 `styles.css` 中添加样式

### 调试技巧

1. **开启开发者工具**
   ```bash
   npm run dev
   ```

2. **查看控制台日志**
   - 按 `F12` 打开开发者工具
   - 查看 Console 标签

3. **检查元素**
   - 右键点击界面元素
   - 选择"检查元素"

---

## 更新日志

### v2.1.0 (2025-01-XX)
- 🎉 首个 Node.js/Electron 版本发布
- ✨ 完整功能实现
- 🎨 4 种主题支持
- ⚡ 性能优化
- 📦 跨平台打包支持

---

## 技术支持

- **GitHub Issues**: [提交问题](https://github.com/10020099/markdown-studio/issues)
- **文档**: 查看项目中的其他 Markdown 文档
- **Email**: support@markdownstudio.com

---

## 许可证

本项目基于 MIT License 开源。详见 [LICENSE](LICENSE) 文件。

---

## 致谢

- **原始版本**: Python/Tkinter 版本
- **重构开发**: Node.js/Electron 版本
- **依赖库**: Electron, Marked.js, 等
- **社区**: 感谢所有贡献者和用户

---

**祝你使用愉快！** ✨

如有任何问题，欢迎随时联系我们。