const { ipcRenderer } = require("electron");
const marked = require("marked");
const hljs = require("highlight.js");
const fs = require("fs");
const Tesseract = require("tesseract.js");

// ==================== 全局变量 ====================
let autoSaveEnabled = true;
let autoSaveTimer = null;
let lastSaveTime = Date.now();
let updateTimer = null;
let currentTheme = "dark";
let fontSize = 14;
let ocrWorker = null;
let focusModeEnabled = false;

// 多标签页系统
let tabs = [];
let activeTabIndex = 0;
let nextTabId = 1;

// ==================== DOM 元素 ====================
const splashScreen = document.getElementById("splash-screen");
const mainApp = document.getElementById("main-app");
const progressBar = document.getElementById("progress-bar");
const splashStatus = document.getElementById("splash-status");
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const filePathLabel = document.getElementById("file-path-label");
const wordCountLabel = document.getElementById("word-count-label");
const typingIndicator = document.getElementById("typing-indicator");
const clockLabel = document.getElementById("clock-label");
const resizer = document.getElementById("resizer");
const tabBar = document.getElementById("tab-bar");

// ==================== 启动画面 ====================
function showSplashScreen() {
  const steps = [
    { text: "初始化界面组件...", progress: 50 },
    { text: "完成加载！", progress: 100 },
  ];

  let currentStep = 0;

  function nextStep() {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      splashStatus.textContent = step.text;
      progressBar.style.width = step.progress + "%";
      currentStep++;
      setTimeout(nextStep, 200);
    } else {
      setTimeout(() => {
        splashScreen.style.display = "none";
        mainApp.style.display = "flex";
        initializeApp();
      }, 300);
    }
  }

  nextStep();
}

// ==================== 初始化应用 ====================
function initializeApp() {
  // 配置 marked
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false,
    sanitize: false,
  });

  // 自定义代码块渲染器：集成 highlight.js 语法高亮
  const renderer = new marked.Renderer();
  renderer.code = function (code, lang, escaped) {
    code = code.replace(/\n$/, "");
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(code, { language: lang }).value;
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>\n`;
      } catch (e) {
        /* fallthrough to auto highlight */
      }
    }
    const highlighted = hljs.highlightAuto(code).value;
    return `<pre><code class="hljs">${highlighted}</code></pre>\n`;
  };
  marked.use({ renderer });

  // 创建初始标签页
  createTab("欢迎", getWelcomeMessage(), null);

  // 启动时钟
  startClock();

  // 启动自动保存
  startAutoSave();

  // 设置事件监听器
  setupEventListeners();

  // 设置自动补全
  setupAutoComplete();

  // 设置分隔条拖拽
  setupResizer();

  // 初始更新预览
  updatePreview();
  updateWordCount();
}

// ==================== 欢迎消息 ====================
function getWelcomeMessage() {
  return `# 🎉 欢迎使用 Markdown Studio Pro！

## ✨ 功能特色

- 🎨 **精美主题**: 支持多种主题切换
- ⚡ **实时预览**: 边写边看，所见即所得
- 📊 **智能统计**: 实时字数和字符统计
- 🔥 **语法高亮**: 让代码更加美观
- 💫 **动画效果**: 流畅的用户体验
- 📑 **多标签页**: 同时编辑多个文件
- ⌨️ **自动补全**: 输入关键词按 Tab 展开

## 🚀 快速开始

1. 点击 **📁 打开** 按钮载入 Markdown 文件
2. 或者直接在左侧编辑器中开始写作
3. 右侧会实时显示渲染后的效果
4. 按 **Ctrl+T** 新建标签页，**Ctrl+W** 关闭标签页

## 💡 自动补全

输入以下关键词后按 **Tab** 键展开：

- \`h1\` ~ \`h3\` → 标题
- \`bold\` → **粗体**
- \`italic\` → *斜体*
- \`code\` → 代码块
- \`link\` → [链接](url)
- \`image\` → ![图片](url)
- \`table\` → 表格
- \`quote\` → 引用
- \`list\` / \`olist\` → 列表
- \`hr\` → 分隔线

---

**开始您的 Markdown 创作之旅吧！** ✍️
`;
}

// ==================== 多标签页管理 ====================
function createTab(title, content, filePath) {
  const tab = {
    id: nextTabId++,
    title: title,
    content: content,
    filePath: filePath,
    isModified: false,
  };
  tabs.push(tab);
  switchTab(tabs.length - 1);
  return tab;
}

function getActiveTab() {
  return tabs[activeTabIndex];
}

function switchTab(index) {
  if (index < 0 || index >= tabs.length) return;

  // 保存当前编辑器内容到当前标签（仅当切换到不同标签时）
  if (activeTabIndex !== index && tabs[activeTabIndex]) {
    tabs[activeTabIndex].content = editor.value;
  }

  activeTabIndex = index;
  const tab = tabs[activeTabIndex];

  // 更新编辑器
  editor.value = tab.content;

  // 更新状态栏
  filePathLabel.textContent = tab.filePath
    ? `📁 ${tab.filePath}`
    : `📄 ${tab.title}`;

  // 更新预览和字数
  updatePreview();
  updateWordCount();
  renderTabBar();
}

function closeTab(index) {
  if (index < 0 || index >= tabs.length) return;

  const tab = tabs[index];

  // 如果有未保存的修改，弹出确认对话框
  if (tab.isModified) {
    if (!confirm(`"${tab.title}" 有未保存的修改，确定要关闭吗？`)) {
      return;
    }
  }

  tabs.splice(index, 1);

  // 如果没有标签了，创建一个新的空白标签
  if (tabs.length === 0) {
    activeTabIndex = -1;
    createTab("新建文件", "", null);
    return;
  }

  if (index === activeTabIndex) {
    // 关闭的是当前标签，切换到前一个（或最后一个）
    const newIndex = Math.min(index, tabs.length - 1);
    activeTabIndex = -1; // 防止 switchTab 保存到已删除的标签
    switchTab(newIndex);
  } else if (index < activeTabIndex) {
    // 关闭的标签在当前标签前面，索引前移
    activeTabIndex--;
    renderTabBar();
  } else {
    // 关闭的标签在后面，不影响当前
    renderTabBar();
  }
}

function renderTabBar() {
  tabBar.innerHTML = "";

  tabs.forEach((tab, index) => {
    const tabItem = document.createElement("div");
    tabItem.className = `tab-item${index === activeTabIndex ? " active" : ""}`;

    const tabTitle = document.createElement("span");
    tabTitle.className = "tab-title";
    tabTitle.textContent = (tab.isModified ? "● " : "") + tab.title;
    tabItem.appendChild(tabTitle);

    const tabClose = document.createElement("span");
    tabClose.className = "tab-close";
    tabClose.textContent = "×";
    tabClose.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(index);
    });
    tabItem.appendChild(tabClose);

    tabItem.addEventListener("click", () => {
      switchTab(index);
    });

    tabBar.appendChild(tabItem);
  });

  // 新建标签按钮
  const newTabBtn = document.createElement("div");
  newTabBtn.className = "tab-new";
  newTabBtn.textContent = "+";
  newTabBtn.title = "新建标签页 (Ctrl+T)";
  newTabBtn.addEventListener("click", () => {
    createTab("新建文件", "", null);
  });
  tabBar.appendChild(newTabBtn);
}

// ==================== 自动补全 ====================
function setupAutoComplete() {
  // Markdown 代码片段表
  const snippets = {
    h1: { text: "# " },
    h2: { text: "## " },
    h3: { text: "### " },
    bold: { text: "**粗体**", selectStart: 2, selectEnd: 4 },
    italic: { text: "*斜体*", selectStart: 1, selectEnd: 3 },
    code: { text: "```\n\n```", selectStart: 4, selectEnd: 4 },
    link: { text: "[文本](url)", selectStart: 1, selectEnd: 3 },
    image: { text: "![替代文本](url)", selectStart: 2, selectEnd: 6 },
    table: {
      text: "| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n",
    },
    quote: { text: "> " },
    list: { text: "- " },
    olist: { text: "1. " },
    hr: { text: "---\n" },
  };

  // 自动配对规则
  const pairs = {
    "(": ")",
    "[": "]",
    "{": "}",
    "`": "`",
    "*": "*",
  };

  editor.addEventListener("keydown", (e) => {
    // Tab 键：展开代码片段或插入制表符
    if (e.key === "Tab") {
      e.preventDefault();
      const cursorPos = editor.selectionStart;
      const textBefore = editor.value.substring(0, cursorPos);
      const match = textBefore.match(/(\w+)$/);

      if (match && snippets[match[1]]) {
        const trigger = match[1];
        const snippet = snippets[trigger];
        const start = cursorPos - trigger.length;
        editor.value =
          editor.value.substring(0, start) +
          snippet.text +
          editor.value.substring(cursorPos);

        if (snippet.selectStart !== undefined) {
          editor.selectionStart = start + snippet.selectStart;
          editor.selectionEnd = start + snippet.selectEnd;
        } else {
          editor.selectionStart = editor.selectionEnd =
            start + snippet.text.length;
        }
      } else {
        // 插入制表符
        const pos = editor.selectionStart;
        editor.value =
          editor.value.substring(0, pos) + "\t" + editor.value.substring(pos);
        editor.selectionStart = editor.selectionEnd = pos + 1;
      }
      onEditorInput();
      return;
    }

    // 自动配对
    if (pairs[e.key]) {
      e.preventDefault();
      const closing = pairs[e.key];
      const start = editor.selectionStart;
      const end = editor.selectionEnd;

      if (start === end) {
        // 无选中文字：插入配对符号，光标置于中间
        editor.value =
          editor.value.substring(0, start) +
          e.key +
          closing +
          editor.value.substring(start);
        editor.selectionStart = editor.selectionEnd = start + 1;
      } else {
        // 有选中文字：用配对符号包裹
        const selectedText = editor.value.substring(start, end);
        editor.value =
          editor.value.substring(0, start) +
          e.key +
          selectedText +
          closing +
          editor.value.substring(end);
        editor.selectionStart = start + 1;
        editor.selectionEnd = end + 1;
      }
      onEditorInput();
      return;
    }
  });
}

// ==================== 事件监听器 ====================
function setupEventListeners() {
  // 编辑器输入事件
  editor.addEventListener("input", onEditorInput);
  editor.addEventListener("keydown", onKeyPress);

  // 工具栏按钮
  document.getElementById("btn-open").addEventListener("click", () => {
    ipcRenderer.send("menu-action", "open-file");
  });

  document.getElementById("btn-save").addEventListener("click", () => {
    saveFile();
  });

  document.getElementById("btn-save-as").addEventListener("click", () => {
    saveFileAs();
  });

  document.getElementById("btn-export-pdf").addEventListener("click", () => {
    exportToPDF();
  });

  // IPC 事件监听
  ipcRenderer.on("new-tab", () => {
    createTab("新建文件", "", null);
  });

  ipcRenderer.on("close-tab", () => {
    closeTab(activeTabIndex);
  });

  ipcRenderer.on("file-opened", (event, data) => {
    const fileName = data.path.split(/[/\\]/).pop();
    // 若当前标签为空白未修改，替换它；否则创建新标签
    const activeTab = getActiveTab();
    if (
      activeTab &&
      !activeTab.filePath &&
      !activeTab.isModified &&
      activeTab.content.trim() === ""
    ) {
      activeTab.title = fileName;
      activeTab.content = data.content;
      activeTab.filePath = data.path;
      activeTab.isModified = false;
      editor.value = data.content;
      filePathLabel.textContent = `📁 ${data.path}`;
      updatePreview();
      updateWordCount();
      renderTabBar();
    } else {
      createTab(fileName, data.content, data.path);
    }
  });

  ipcRenderer.on("save-file", (event, path) => {
    const content = editor.value;
    ipcRenderer.send("save-file-content", { path, content });
    const tab = getActiveTab();
    if (tab) {
      tab.filePath = path;
      tab.title = path.split(/[/\\]/).pop();
      tab.isModified = false;
      tab.content = content;
    }
    filePathLabel.textContent = `📁 ${path}`;
    lastSaveTime = Date.now();
    renderTabBar();
  });

  ipcRenderer.on("export-pdf", (event, path) => {
    const html = generatePDFHTML();
    ipcRenderer.send("export-pdf-content", { path, html });
  });

  ipcRenderer.on("change-theme", (event, themeName) => {
    changeTheme(themeName);
  });

  ipcRenderer.on("show-statistics", () => {
    showStatistics();
  });

  ipcRenderer.on("show-settings", () => {
    showSettings();
  });

  ipcRenderer.on("toggle-auto-save", (event, enabled) => {
    autoSaveEnabled = enabled;
    showNotification(`自动保存已${enabled ? "启用" : "禁用"}！ 💾`);
  });

  ipcRenderer.on("toggle-focus-mode", () => {
    toggleFocusMode();
  });

  ipcRenderer.on("ocr-image", (event, filePaths) => {
    ocrImage(filePaths);
  });

  ipcRenderer.on("show-shortcuts", () => {
    showShortcuts();
  });

  ipcRenderer.on("show-about", () => {
    showAbout();
  });

  ipcRenderer.on("zoom-in", () => {
    increaseFontSize();
  });

  ipcRenderer.on("zoom-out", () => {
    decreaseFontSize();
  });

  ipcRenderer.on("zoom-reset", () => {
    resetFontSize();
  });
}

// ==================== 编辑器事件处理 ====================
function onEditorInput() {
  // 保存当前编辑器内容到当前标签
  const tab = getActiveTab();
  if (tab) {
    tab.content = editor.value;
    if (!tab.isModified) {
      tab.isModified = true;
      renderTabBar();
    }
  }
  scheduleUpdate();
  updateWordCount();
}

function onKeyPress() {
  showTypingIndicator();
}

function showTypingIndicator() {
  const states = [
    "✏️ 正在编辑...",
    "⌨️ 键盘飞舞中...",
    "📝 灵感涌现...",
    "💭 思维风暴...",
    "🎯 专注创作...",
  ];
  const state = states[Math.floor(Math.random() * states.length)];
  typingIndicator.textContent = state;

  setTimeout(() => {
    typingIndicator.textContent = "";
  }, 500);
}

function scheduleUpdate() {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  updateTimer = setTimeout(() => {
    updatePreview();
  }, 500);
}

// ==================== Markdown 预览 ====================
function updatePreview() {
  const text = editor.value.trim();

  if (text) {
    try {
      const html = marked.parse(text);
      preview.innerHTML = html;
    } catch (error) {
      preview.innerHTML = `
                <div style="color: #f38ba8;">
                    <h3>⚠️ 预览渲染错误</h3>
                    <p>错误信息: ${error.message}</p>
                </div>
            `;
    }
  } else {
    preview.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2 style="color: #89b4fa; font-size: 28px;">✨ 欢迎使用 Markdown Studio Pro!</h2>
                <p style="color: #a6e3a1; font-size: 16px;">在左侧编辑器中开始编写 Markdown 内容</p>
                <p style="color: #cba6f7; font-size: 16px;">实时预览将在这里显示</p>
            </div>
        `;
  }
}

// ==================== 字数统计 ====================
function updateWordCount() {
  const text = editor.value.trim();
  const charCount = text.length;
  const wordCount = text ? text.split(/\s+/).length : 0;
  wordCountLabel.textContent = `📊 字数: ${wordCount} | 字符: ${charCount}`;
}

// ==================== 时钟 ====================
function startClock() {
  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("zh-CN", { hour12: false });
    clockLabel.textContent = `🕐 ${timeString}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// ==================== 自动保存 ====================
function startAutoSave() {
  autoSaveTimer = setInterval(() => {
    const tab = getActiveTab();
    if (
      autoSaveEnabled &&
      tab &&
      tab.filePath &&
      tab.isModified &&
      Date.now() - lastSaveTime > 60000
    ) {
      try {
        const content = editor.value;
        fs.writeFileSync(tab.filePath, content, "utf-8");
        tab.content = content;
        tab.isModified = false;
        typingIndicator.textContent = "💾 自动保存完成";
        setTimeout(() => {
          typingIndicator.textContent = "";
        }, 2000);
        lastSaveTime = Date.now();
        renderTabBar();
      } catch (error) {
        console.error("自动保存失败:", error);
      }
    }
  }, 60000);
}

// ==================== 文件操作 ====================
function saveFile() {
  const tab = getActiveTab();
  if (tab && tab.filePath) {
    const content = editor.value;
    ipcRenderer.send("save-file-content", { path: tab.filePath, content });
    tab.content = content;
    tab.isModified = false;
    lastSaveTime = Date.now();
    renderTabBar();
  } else {
    saveFileAs();
  }
}

function saveFileAs() {
  ipcRenderer.send("menu-action", "save-file-as");
}

function exportToPDF() {
  ipcRenderer.send("menu-action", "export-pdf");
}

function generatePDFHTML() {
  const text = editor.value;
  const html = marked.parse(text);
  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: 'SimSun', serif;
                    padding: 20px;
                    line-height: 1.6;
                }
                h1 { color: #2196F3; }
                h2 { color: #4CAF50; }
                h3 { color: #9C27B0; }
                code {
                    background-color: #f5f5f5;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                pre {
                    background-color: #f5f5f5;
                    padding: 15px;
                    border-radius: 8px;
                    overflow-x: auto;
                }
                blockquote {
                    border-left: 4px solid #FF9800;
                    padding-left: 20px;
                    color: #666;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f5f5f5;
                }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `;
}

// ==================== 主题切换 ====================
function changeTheme(themeName) {
  currentTheme = themeName;
  // 移除所有主题类（保留 focus-mode 等其他类）
  document.body.classList.remove(
    "theme-dark",
    "theme-light",
    "theme-rainbow",
    "theme-gaming",
  );
  // 添加新主题类（dark 是默认主题，不需要额外类）
  if (themeName !== "dark") {
    document.body.classList.add(`theme-${themeName}`);
  }
  showNotification(`🎨 已切换到 ${themeName} 主题！`);
}

// ==================== 专注模式 ====================
function toggleFocusMode() {
  focusModeEnabled = !focusModeEnabled;
  document.body.classList.toggle("focus-mode", focusModeEnabled);
  showNotification(
    focusModeEnabled ? "🎯 专注模式已开启" : "🎯 专注模式已退出",
  );
}

// ==================== 字体大小调整 ====================
function increaseFontSize() {
  fontSize = Math.min(fontSize + 2, 24);
  editor.style.fontSize = fontSize + "px";
}

function decreaseFontSize() {
  fontSize = Math.max(fontSize - 2, 8);
  editor.style.fontSize = fontSize + "px";
}

function resetFontSize() {
  fontSize = 14;
  editor.style.fontSize = fontSize + "px";
}

// ==================== 分隔条拖拽 ====================
function setupResizer() {
  let isResizing = false;

  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    document.body.style.cursor = "col-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const container = document.querySelector(".main-content");
    const containerRect = container.getBoundingClientRect();
    const offsetX = e.clientX - containerRect.left;
    const percentage = (offsetX / containerRect.width) * 100;

    if (percentage > 20 && percentage < 80) {
      const editorPanel = document.querySelector(".editor-panel");
      const previewPanel = document.querySelector(".preview-panel");
      editorPanel.style.flex = `0 0 ${percentage}%`;
      previewPanel.style.flex = `0 0 ${100 - percentage}%`;
    }
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.cursor = "default";
  });
}

// ==================== 模态对话框 ====================
function showModal(title, content, buttons = []) {
  const modalContainer = document.getElementById("modal-container");

  const modal = document.createElement("div");
  modal.className = "modal-overlay";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const header = document.createElement("div");
  header.className = "modal-header";
  header.textContent = title;

  const body = document.createElement("div");
  body.className = "modal-body";
  if (typeof content === "string") {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }

  const footer = document.createElement("div");
  footer.className = "modal-footer";

  if (buttons.length === 0) {
    buttons = [{ text: "确定", primary: true, onClick: () => closeModal() }];
  }

  buttons.forEach((btn) => {
    const button = document.createElement("button");
    button.className = `modal-button ${btn.primary ? "modal-button-primary" : "modal-button-secondary"}`;
    button.textContent = btn.text;
    button.onclick = () => {
      if (btn.onClick) btn.onClick();
      closeModal();
    };
    footer.appendChild(button);
  });

  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(footer);
  modal.appendChild(modalContent);
  modalContainer.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  function closeModal() {
    modal.remove();
  }
}

// ==================== 通知提示 ====================
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// ==================== 统计信息 ====================
function showStatistics() {
  const tab = getActiveTab();
  const text = editor.value.trim();
  const charCount = text.length;
  const wordCount = text ? text.split(/\s+/).length : 0;
  const lines = text ? text.split("\n").length : 0;
  const paragraphs = text
    ? text.split(/\n\n+/).filter((p) => p.trim()).length
    : 0;
  const now = new Date().toLocaleString("zh-CN");

  const content = `
        <div style="font-family: monospace; line-height: 2;">
            <p>📝 <strong>文档统计信息</strong></p>
            <p>📄 总字符数: ${charCount}</p>
            <p>🔤 总字数: ${wordCount}</p>
            <p>📋 行数: ${lines}</p>
            <p>📄 段落数: ${paragraphs}</p>
            <p>⏰ 最后编辑: ${now}</p>
            <p>📁 当前文件: ${tab ? (tab.filePath || tab.title) : "未保存"}</p>
        </div>
    `;

  showModal("📊 文档统计", content);
}

// ==================== 设置 ====================
function showSettings() {
  const content = document.createElement("div");
  content.innerHTML = `
        <div style="padding: 20px;">
            <p style="margin-bottom: 15px;">
                <strong>💾 自动保存:</strong>
                <input type="checkbox" id="auto-save-checkbox" ${autoSaveEnabled ? "checked" : ""}
                       style="margin-left: 10px; width: 20px; height: 20px; cursor: pointer;">
            </p>
            <p style="color: #bac2de; font-size: 12px;">
                自动保存将在60秒后自动保存您的文档
            </p>
        </div>
    `;

  showModal("🔧 设置", content, [
    {
      text: "确定",
      primary: true,
      onClick: () => {
        const checkbox = document.getElementById("auto-save-checkbox");
        autoSaveEnabled = checkbox.checked;
      },
    },
  ]);
}

// ==================== OCR 识别 ====================
async function ocrImage(filePaths) {
  if (filePaths.length === 0) return;

  // 显示处理中的模态框
  const processingModal = document.createElement("div");
  processingModal.className = "modal-overlay";
  processingModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">📷 OCR 识别中...</div>
            <div class="modal-body" style="text-align: center; padding: 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">正在识别图片文字，请稍候...</p>
                <div style="color: #89b4fa; font-size: 14px;" id="ocr-progress">准备中...</div>
                <div style="margin-top: 20px; color: #bac2de; font-size: 12px;">
                    支持中文、英文等多种语言
                </div>
            </div>
        </div>
    `;
  document.getElementById("modal-container").appendChild(processingModal);

  const progressText = document.getElementById("ocr-progress");

  try {
    // 初始化 OCR Worker（如果还没有）
    if (!ocrWorker) {
      progressText.textContent = "正在初始化 OCR 引擎...";
      ocrWorker = await Tesseract.createWorker("chi_sim+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            progressText.textContent = `识别进度: ${Math.round(m.progress * 100)}%`;
          }
        },
      });
    }

    const results = [];

    // 处理每个图片
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      progressText.textContent = `正在识别第 ${i + 1}/${filePaths.length} 张图片...`;

      try {
        const {
          data: { text },
        } = await ocrWorker.recognize(filePath);
        if (text.trim()) {
          results.push(
            `\n### 图片 ${i + 1}: ${filePath.split(/[/\\]/).pop()}\n\n${text.trim()}\n`,
          );
        }
      } catch (error) {
        console.error(`识别图片 ${filePath} 失败:`, error);
        results.push(
          `\n### 图片 ${i + 1}: ${filePath.split(/[/\\]/).pop()}\n\n[识别失败: ${error.message}]\n`,
        );
      }
    }

    // 关闭处理中的模态框
    processingModal.remove();

    // 将识别结果插入编辑器
    if (results.length > 0) {
      const combinedText = results.join("\n---\n");
      const currentText = editor.value;
      const cursorPos = editor.selectionStart;
      editor.value =
        currentText.slice(0, cursorPos) +
        combinedText +
        currentText.slice(cursorPos);

      // 更新当前标签
      const tab = getActiveTab();
      if (tab) {
        tab.content = editor.value;
        tab.isModified = true;
        renderTabBar();
      }

      updatePreview();
      updateWordCount();
      showNotification("✅ OCR 识别完成！");
    } else {
      showNotification("⚠️ 未识别到任何文字");
    }
  } catch (error) {
    console.error("OCR 识别失败:", error);
    processingModal.remove();
    showModal(
      "❌ OCR 识别失败",
      `
            <p style="color: #f38ba8;">识别过程中出现错误：</p>
            <p style="color: #fab387; margin-top: 10px;">${error.message}</p>
            <p style="margin-top: 20px; color: #bac2de; font-size: 12px;">
                请确保图片格式正确（支持 PNG、JPG、JPEG、BMP、GIF）
            </p>
        `,
    );
  }
}

// ==================== 快捷键帮助 ====================
function showShortcuts() {
  const content = `
        <div style="font-family: monospace; line-height: 1.8; font-size: 13px;">
            <h3 style="color: #89b4fa; margin-bottom: 15px;">🎯 Markdown Studio Pro 快捷键指南</h3>

            <h4 style="color: #a6e3a1; margin-top: 20px;">📁 文件操作:</h4>
            <p>Ctrl + T &nbsp;&nbsp;&nbsp;&nbsp; 新建标签页</p>
            <p>Ctrl + W &nbsp;&nbsp;&nbsp;&nbsp; 关闭标签页</p>
            <p>Ctrl + O &nbsp;&nbsp;&nbsp;&nbsp; 打开文件</p>
            <p>Ctrl + S &nbsp;&nbsp;&nbsp;&nbsp; 保存文件</p>
            <p>Ctrl + Shift + S &nbsp;&nbsp;&nbsp;&nbsp; 另存为</p>
            <p>Ctrl + P &nbsp;&nbsp;&nbsp;&nbsp; 导出PDF</p>

            <h4 style="color: #cba6f7; margin-top: 20px;">✂️ 编辑操作:</h4>
            <p>Ctrl + Z &nbsp;&nbsp;&nbsp;&nbsp; 撤销</p>
            <p>Ctrl + Y &nbsp;&nbsp;&nbsp;&nbsp; 重做</p>
            <p>Ctrl + A &nbsp;&nbsp;&nbsp;&nbsp; 全选</p>
            <p>Ctrl + C &nbsp;&nbsp;&nbsp;&nbsp; 复制</p>
            <p>Ctrl + V &nbsp;&nbsp;&nbsp;&nbsp; 粘贴</p>
            <p>Ctrl + X &nbsp;&nbsp;&nbsp;&nbsp; 剪切</p>

            <h4 style="color: #fab387; margin-top: 20px;">⌨️ 自动补全:</h4>
            <p>Tab &nbsp;&nbsp;&nbsp;&nbsp; 展开代码片段</p>
            <p>h1/h2/h3 + Tab &nbsp;&nbsp;&nbsp;&nbsp; 标题</p>
            <p>bold + Tab &nbsp;&nbsp;&nbsp;&nbsp; 粗体</p>
            <p>italic + Tab &nbsp;&nbsp;&nbsp;&nbsp; 斜体</p>
            <p>code + Tab &nbsp;&nbsp;&nbsp;&nbsp; 代码块</p>
            <p>link + Tab &nbsp;&nbsp;&nbsp;&nbsp; 链接</p>
            <p>image + Tab &nbsp;&nbsp;&nbsp;&nbsp; 图片</p>
            <p>table + Tab &nbsp;&nbsp;&nbsp;&nbsp; 表格</p>
            <p>quote + Tab &nbsp;&nbsp;&nbsp;&nbsp; 引用</p>
            <p>list/olist + Tab &nbsp;&nbsp;&nbsp;&nbsp; 列表</p>
            <p>hr + Tab &nbsp;&nbsp;&nbsp;&nbsp; 分隔线</p>

            <h4 style="color: #fab387; margin-top: 20px;">🔍 视图操作:</h4>
            <p>F11 &nbsp;&nbsp;&nbsp;&nbsp; 全屏模式</p>
            <p>Ctrl + Shift + F &nbsp;&nbsp;&nbsp;&nbsp; 专注模式</p>
            <p>Ctrl + + &nbsp;&nbsp;&nbsp;&nbsp; 放大字体</p>
            <p>Ctrl + - &nbsp;&nbsp;&nbsp;&nbsp; 缩小字体</p>
            <p>Ctrl + 0 &nbsp;&nbsp;&nbsp;&nbsp; 重置字体</p>
            <p>F12 &nbsp;&nbsp;&nbsp;&nbsp; 开发者工具</p>

            <h4 style="color: #f5c2e7; margin-top: 20px;">💡 Markdown 语法:</h4>
            <p># 标题 &nbsp;&nbsp;&nbsp;&nbsp; 一级标题</p>
            <p>## 标题 &nbsp;&nbsp;&nbsp;&nbsp; 二级标题</p>
            <p>**粗体** &nbsp;&nbsp;&nbsp;&nbsp; 粗体文本</p>
            <p>*斜体* &nbsp;&nbsp;&nbsp;&nbsp; 斜体文本</p>
            <p>\`代码\` &nbsp;&nbsp;&nbsp;&nbsp; 行内代码</p>
            <p>\`\`\`代码块\`\`\` &nbsp;&nbsp;&nbsp;&nbsp; 代码块</p>
            <p>[链接](url) &nbsp;&nbsp;&nbsp;&nbsp; 超链接</p>
            <p>![图片](url) &nbsp;&nbsp;&nbsp;&nbsp; 图片</p>
        </div>
    `;

  showModal("⌨️ 快捷键指南", content);
}

// ==================== 关于 ====================
function showAbout() {
  const now = new Date();
  const content = `
        <div style="text-align: center; padding: 20px;">
            <h2 style="color: #cba6f7; font-size: 24px; margin-bottom: 20px;">✨ Markdown Studio Pro ✨</h2>

            <p style="margin: 10px 0;">🎨 版本: 2.2 Node.js Edition</p>
            <p style="margin: 10px 0;">👨‍💻 开发者: Markdown Studio Team</p>
            <p style="margin: 10px 0;">📅 更新日期: ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日</p>

            <h3 style="color: #89b4fa; margin-top: 30px; margin-bottom: 15px;">🌟 特色功能:</h3>
            <ul style="text-align: left; display: inline-block; line-height: 1.8;">
                <li>实时预览渲染</li>
                <li>多主题切换支持</li>
                <li>智能统计分析</li>
                <li>自动保存功能</li>
                <li>专业语法高亮</li>
                <li>炫酷动画效果</li>
                <li>多标签页编辑</li>
                <li>Markdown 自动补全</li>
                <li>专注模式</li>
            </ul>

            <h3 style="color: #a6e3a1; margin-top: 30px; margin-bottom: 15px;">🛠️ 技术栈:</h3>
            <ul style="text-align: left; display: inline-block; line-height: 1.8;">
                <li>Node.js + Electron</li>
                <li>Marked.js (Markdown 解析)</li>
                <li>Highlight.js (语法高亮)</li>
                <li>Tesseract.js (OCR 识别)</li>
                <li>HTML5 + CSS3</li>
                <li>JavaScript ES6+</li>
            </ul>

            <p style="margin-top: 30px; color: #f5c2e7; font-size: 16px;">💝 感谢使用本软件！</p>
            <p style="margin-top: 10px; color: #bac2de; font-size: 12px;">🌐 开源地址: github.com/markdown-studio</p>
        </div>
    `;

  showModal("❓ 关于", content);
}

// ==================== 启动应用 ====================
window.addEventListener("DOMContentLoaded", () => {
  showSplashScreen();
});

// ==================== 清理资源 ====================
window.addEventListener("beforeunload", async () => {
  // 清理 OCR Worker
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
});
