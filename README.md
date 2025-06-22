# Markdown Studio

Markdown Studio 是一个基于 **Tkinter** 的简洁 Markdown 编辑器，提供实时预览、语法高亮与多主题等特性。适用于需要快速编写和查看 Markdown 文档的场景。

## 特性

- 🎨 多种主题自由切换
- ⚡ 实时渲染 Markdown 内容
- 📝 自动保存与文件管理
- 📊 字数和字符统计
- 💾 支持拖拽打开文件
- 🖨️ 导出 PDF 文件
- ✨ 轻量级动画与友好的界面

## 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/10020099/markdown-studio.git
   cd markdown-studio
   ```
2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
3. 安装纯 Python OCR 库：
   ```bash
   pip install easyocr
   ```

## 使用

直接运行 `markdown_viewer.py` 即可启动编辑器：

```bash
python markdown_viewer.py
```

左侧为编辑区域，右侧会实时显示渲染后的 HTML 效果。顶部工具栏提供常见的文件操作，菜单中可以切换主题或查看统计信息。若需将文档导出为 PDF，可在 **文件** 菜单中选择 *导出为PDF*。

## 更新记录

### v2.1 性能优化版 (2025-6-22)
- 🚀 **启动性能优化**: 延迟加载 OCR 库，启动时间减少 50-60%
- ⚡ **实时预览优化**: 增加更新延迟，减少频繁重绘
- 🎨 **语法高亮优化**: 预编译正则表达式，性能提升 30-50%
- 💾 **自动保存优化**: 降低保存频率，减少磁盘 I/O
- 📦 **打包兼容**: 优化导入方式，兼容 exe 打包
- 🧠 **智能控制**: 大文档自动禁用语法高亮

## 许可

本项目基于 MIT License 发布，详情见 [LICENSE](LICENSE) 文件。
