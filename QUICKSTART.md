# 🚀 Markdown Studio Pro - 快速启动指南

## Node.js 版本快速开始

### 1️⃣ 安装依赖

首先确保你已经安装了 Node.js（建议 16.x 或更高版本），然后在项目目录下运行：

```bash
npm install
```

这将安装以下核心依赖：
- `electron` - 桌面应用框架
- `marked` - Markdown 解析器
- `highlight.js` - 代码高亮（可选）

### 2️⃣ 启动应用

**开发模式**（带开发者工具）：
```bash
npm run dev
```

**正常启动**：
```bash
npm start
```

### 3️⃣ 打包应用

**打包当前平台**：
```bash
npm run build
```

**打包 Windows 版本**：
```bash
npm run build:win
```

**打包 macOS 版本**：
```bash
npm run build:mac
```

**打包 Linux 版本**：
```bash
npm run build:linux
```

打包后的文件在 `dist/` 目录中。

---

## Python 版本快速开始

### 1️⃣ 安装依赖

```bash
pip install -r requirements.txt
```

### 2️⃣ 启动应用

```bash
python markdown_viewer.py
```

---

## 🎯 核心功能使用

### 文件操作
- **打开文件**: `Ctrl/Cmd + O` 或点击 "📁 打开"
- **保存文件**: `Ctrl/Cmd + S` 或点击 "💾 保存"
- **另存为**: `Ctrl/Cmd + Shift + S`
- **导出 PDF**: `Ctrl/Cmd + P`

### 主题切换
菜单栏 → 🎨 主题 → 选择你喜欢的主题：
- 🌙 暗黑主题
- ☀️ 明亮主题
- 🌈 彩虹主题
- 🎮 游戏主题

### 视图调整
- **放大**: `Ctrl/Cmd + +`
- **缩小**: `Ctrl/Cmd + -`
- **重置**: `Ctrl/Cmd + 0`
- **全屏**: `F11`

### 实用工具
- **📊 统计信息**: 查看字数、字符数等
- **💾 自动保存**: 每 60 秒自动保存
- **⌨️ 快捷键**: 查看所有快捷键

---

## 📝 Markdown 语法速查

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体文本**
*斜体文本*
~~删除线~~

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

[链接文本](https://example.com)
![图片描述](image.jpg)

`行内代码`

​```
代码块
​```

> 引用文本

| 表头1 | 表头2 |
|------|------|
| 单元格1 | 单元格2 |

---
```

---

## 🔧 常见问题

### Q: 如何更改编辑器字体？
A: 修改 `styles.css` 中的 `.editor` 样式，更改 `font-family` 属性。

### Q: PDF 导出中文显示不正常？
A: 确保系统安装了中文字体（如 SimSun、Microsoft YaHei 等）。

### Q: 如何添加自定义主题？
A: 在 `styles.css` 中添加新的主题类（如 `.theme-custom`），然后在 `renderer.js` 的 `changeTheme` 函数中添加对应逻辑。

### Q: Node.js 版本和 Python 版本有什么区别？
A: 
- **Node.js 版本**: 跨平台性更好，界面更现代，易于扩展
- **Python 版本**: 更轻量，启动更快，OCR 功能完整

### Q: 如何启用 OCR 功能（Node.js 版本）？
A: 需要集成 Tesseract.js 或使用在线 OCR API。可以参考 `renderer.js` 中的 `ocrImage` 函数进行扩展。

---

## 📚 更多资源

- **完整文档**: 查看 `README_NODEJS.md`（Node.js 版本）或 `README.md`（Python 版本）
- **项目结构**: 了解各文件的作用和组织方式
- **贡献指南**: 欢迎提交 Issue 和 PR

---

## 💡 小贴士

1. **性能优化**: 编辑大文件时，语法高亮会自动禁用以提升性能
2. **自动保存**: 记得先保存一次文件，之后才会启用自动保存
3. **快捷键**: 按 `Ctrl/Cmd + ?` 或菜单中的 "⌨️ 快捷键" 查看所有快捷键
4. **拖拽调整**: 可以拖拽中间的分隔条调整编辑器和预览区域的大小
5. **实时预览**: 输入会有 500ms 的延迟后才更新预览，避免频繁渲染

---

**祝你使用愉快！** ✨

如有问题，请访问 [GitHub Issues](https://github.com/10020099/markdown-studio/issues)