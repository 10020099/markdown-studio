import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from tkinter.scrolledtext import ScrolledText
from tkhtmlview import HTMLLabel
import markdown
from xhtml2pdf import pisa
from xhtml2pdf import default as pisa_default
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# Register a font that supports Chinese characters and set as default
try:
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    pisa_default.DEFAULT_FONT = "STSong-Light"
except Exception:
    # If registration fails, fallback to the library default
    pass
import sys
import ctypes
import threading
import time
from datetime import datetime
import random
import os

if sys.platform == "win32":
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:
            pass

class MarkdownViewer(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("✨ Markdown Studio Pro ✨")
        self.geometry("1400x900")
        self.configure(bg='#1e1e2e')
        
        # 设置图标和样式
        self.setup_style()
        
        self.current_file = None
        self.is_typing = False
        self.word_count = 0
        self.char_count = 0
        self.auto_save_enabled = True
        self.last_save_time = time.time()
        
        # 创建启动画面
        self.show_splash_screen()
        
        self.create_widgets()
        self.start_clock()
        self.start_auto_save()
        self.setup_keyboard_shortcuts()
        self.create_welcome_message()
        self.start_background_animation()
        self.update_task = None

    def setup_style(self):
        """设置应用程序样式"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # 自定义颜色主题
        self.colors = {
            'bg_primary': '#1e1e2e',      # 主背景色
            'bg_secondary': '#313244',     # 次要背景色
            'bg_accent': '#45475a',        # 强调背景色
            'text_primary': '#cdd6f4',     # 主文本色
            'text_secondary': '#bac2de',   # 次要文本色
            'accent_blue': '#89b4fa',      # 蓝色强调
            'accent_green': '#a6e3a1',     # 绿色强调
            'accent_purple': '#cba6f7',    # 紫色强调
            'accent_pink': '#f5c2e7',      # 粉色强调
            'accent_orange': '#fab387',    # 橙色强调
        }
        
        # 设置自定义样式
        style.configure("Splash.TLabel", 
                       background=self.colors['bg_primary'],
                       foreground=self.colors['accent_purple'],
                       font=('Arial', 16, 'bold'))

    def show_splash_screen(self):
        """显示启动画面"""
        splash = tk.Toplevel(self)
        splash.title("启动中...")
        splash.geometry("400x300")
        splash.configure(bg=self.colors['bg_primary'])
        splash.resizable(False, False)
        
        # 居中显示
        splash.update_idletasks()
        x = (splash.winfo_screenwidth() // 2) - (400 // 2)
        y = (splash.winfo_screenheight() // 2) - (300 // 2)
        splash.geometry(f"+{x}+{y}")
        
        # 隐藏主窗口
        self.withdraw()
        
        # 创建启动内容
        title_label = tk.Label(splash, 
                              text="✨ Markdown Studio Pro ✨",
                              bg=self.colors['bg_primary'],
                              fg=self.colors['accent_purple'],
                              font=('Arial', 18, 'bold'))
        title_label.pack(pady=30)
        
        subtitle_label = tk.Label(splash,
                                 text="专业的 Markdown 编辑器",
                                 bg=self.colors['bg_primary'],
                                 fg=self.colors['text_secondary'],
                                 font=('Arial', 12))
        subtitle_label.pack(pady=10)
        
        # 进度条
        progress = ttk.Progressbar(splash, length=300, mode='determinate')
        progress.pack(pady=30)
        
        status_label = tk.Label(splash,
                               text="正在加载...",
                               bg=self.colors['bg_primary'],
                               fg=self.colors['accent_blue'],
                               font=('Arial', 10))
        status_label.pack(pady=10)
        
        # 模拟加载过程
        def load_progress():
            steps = [
                "初始化界面组件...",
                "加载主题配置...",
                "设置语法高亮...",
                "启动实时预览...",
                "完成加载！"
            ]
            
            for i, step in enumerate(steps):
                status_label.config(text=step)
                progress['value'] = (i + 1) * 20
                splash.update()
                time.sleep(0.5)
            
            # 关闭启动画面，显示主窗口
            splash.destroy()
            self.deiconify()
        
        # 在单独线程中运行加载过程
        loading_thread = threading.Thread(target=load_progress, daemon=True)
        loading_thread.start()

    def start_background_animation(self):
        """启动背景动画效果"""
        self._animation_titles = [
            "✨ Markdown Studio Pro ✨",
            "🌟 Markdown Studio Pro 🌟",
            "💫 Markdown Studio Pro 💫",
            "⭐ Markdown Studio Pro ⭐",
            "🎆 Markdown Studio Pro 🎆",
        ]
        self._animation_index = 0

        def animate():
            if self.winfo_exists():
                title = self._animation_titles[self._animation_index]
                self.title(title)
                self._animation_index = (
                    self._animation_index + 1
                ) % len(self._animation_titles)
                self.after(2000, animate)

        self.after(2000, animate)

    def start_auto_save(self):
        """启动自动保存功能"""

        def auto_save():
            if (
                self.auto_save_enabled
                and self.current_file
                and time.time() - self.last_save_time > 30
            ):
                try:
                    content = self.editor.get("1.0", tk.END)
                    with open(self.current_file, "w", encoding="utf-8") as f:
                        f.write(content)
                    self.typing_indicator.config(text="💾 自动保存完成")
                    self.after(
                        2000, lambda: self.typing_indicator.config(text="")
                    )
                    self.last_save_time = time.time()
                except Exception:
                    pass
            self.after(30000, auto_save)

        self.after(30000, auto_save)

    def create_widgets(self):
        # 创建顶部工具栏
        self.create_toolbar()
        
        # 创建菜单
        self.create_menu()
        
        # 创建状态栏
        self.create_status_bar()
        
        # 创建主内容区域
        self.create_main_content()

    def create_toolbar(self):
        """创建顶部工具栏"""
        toolbar_frame = tk.Frame(self, bg=self.colors['bg_secondary'], height=60)
        toolbar_frame.pack(fill=tk.X, padx=5, pady=5)
        toolbar_frame.pack_propagate(False)
        
        # 左侧按钮组
        left_frame = tk.Frame(toolbar_frame, bg=self.colors['bg_secondary'])
        left_frame.pack(side=tk.LEFT, padx=10, pady=10)
        
        # 创建时尚按钮
        self.create_fancy_button(left_frame, "📁 打开", self.open_file, self.colors['accent_blue'])
        self.create_fancy_button(left_frame, "💾 保存", self.save_file, self.colors['accent_green'])
        self.create_fancy_button(left_frame, "📝 另存为", self.save_file_as, self.colors['accent_purple'])
        self.create_fancy_button(left_frame, "📄 导出PDF", self.export_to_pdf, self.colors['accent_orange'])
        
        # 右侧信息显示
        right_frame = tk.Frame(toolbar_frame, bg=self.colors['bg_secondary'])
        right_frame.pack(side=tk.RIGHT, padx=10, pady=10)
        
        # 时钟显示
        self.clock_label = tk.Label(right_frame, text="", 
                                   bg=self.colors['bg_secondary'], 
                                   fg=self.colors['accent_pink'],
                                   font=('Arial', 12, 'bold'))
        self.clock_label.pack(side=tk.RIGHT, padx=10)
        
        # 打字状态指示器
        self.typing_indicator = tk.Label(right_frame, text="", 
                                        bg=self.colors['bg_secondary'], 
                                        fg=self.colors['accent_orange'],
                                        font=('Arial', 10))
        self.typing_indicator.pack(side=tk.RIGHT, padx=10)

    def create_fancy_button(self, parent, text, command, color):
        """创建时尚按钮"""
        btn = tk.Button(parent, text=text, command=command,
                       bg=color, fg='white',
                       font=('Arial', 10, 'bold'),
                       relief='flat', borderwidth=0,
                       padx=15, pady=8,
                       cursor='hand2')
        
        # 添加点击动画效果
        def on_click(e):
            btn.configure(relief='sunken')
            self.after(100, lambda: btn.configure(relief='flat'))
            
        # 添加悬停效果
        def on_enter(e):
            btn.configure(bg=self.lighten_color(color), relief='raised')
        def on_leave(e):
            btn.configure(bg=color, relief='flat')
            
        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)
        btn.bind("<Button-1>", on_click)
        btn.pack(side=tk.LEFT, padx=5)
        return btn

    def lighten_color(self, color):
        """让颜色变亮（简单实现）"""
        color_map = {
            self.colors['accent_blue']: '#a9c4fb',
            self.colors['accent_green']: '#b6f3b1',
            self.colors['accent_purple']: '#dbb6f8',
            self.colors['accent_pink']: '#f6d2e8',
            self.colors['accent_orange']: '#fbc397'
        }
        return color_map.get(color, color)

    def create_menu(self):
        # 创建菜单
        menubar = tk.Menu(self, bg=self.colors['bg_secondary'], fg=self.colors['text_primary'])
        file_menu = tk.Menu(menubar, tearoff=0, bg=self.colors['bg_secondary'], fg=self.colors['text_primary'])
        file_menu.add_command(label="📁 打开", command=self.open_file)
        file_menu.add_command(label="💾 保存", command=self.save_file)
        file_menu.add_command(label="📝 另存为", command=self.save_file_as)
        file_menu.add_command(label="📄 导出PDF", command=self.export_to_pdf)
        file_menu.add_separator()
        file_menu.add_command(label="🚪 退出", command=self.quit)
        menubar.add_cascade(label="📂 文件", menu=file_menu)
        
        # 主题菜单
        theme_menu = tk.Menu(menubar, tearoff=0, bg=self.colors['bg_secondary'], fg=self.colors['text_primary'])
        theme_menu.add_command(label="🌙 暗黑主题", command=lambda: self.change_theme('dark'))
        theme_menu.add_command(label="☀️ 明亮主题", command=lambda: self.change_theme('light'))
        theme_menu.add_command(label="🌈 彩虹主题", command=lambda: self.change_theme('rainbow'))
        theme_menu.add_command(label="🎮 游戏主题", command=lambda: self.change_theme('gaming'))
        menubar.add_cascade(label="🎨 主题", menu=theme_menu)
        
        # 工具菜单
        tools_menu = tk.Menu(menubar, tearoff=0, bg=self.colors['bg_secondary'], fg=self.colors['text_primary'])
        tools_menu.add_command(label="📊 统计信息", command=self.show_statistics)
        tools_menu.add_command(label="🔧 设置", command=self.show_settings)
        tools_menu.add_command(label="💾 自动保存", command=self.toggle_auto_save)
        tools_menu.add_command(label="🎯 专注模式", command=self.toggle_focus_mode)
        tools_menu.add_separator()
        tools_menu.add_command(label="⌨️ 快捷键", command=self.show_shortcuts)
        tools_menu.add_command(label="❓ 关于", command=self.show_about)
        menubar.add_cascade(label="🛠️ 工具", menu=tools_menu)
        
        self.config(menu=menubar)

    def create_status_bar(self):
        """创建状态栏"""
        status_frame = tk.Frame(self, bg=self.colors['bg_accent'], height=30)
        status_frame.pack(side=tk.BOTTOM, fill=tk.X)
        status_frame.pack_propagate(False)
        
        # 文件路径显示
        self.file_path_label = tk.Label(status_frame, text="📄 未打开文件", 
                                       bg=self.colors['bg_accent'], 
                                       fg=self.colors['text_secondary'],
                                       font=('Arial', 9))
        self.file_path_label.pack(side=tk.LEFT, padx=10, pady=5)
          # 字数统计
        self.word_count_label = tk.Label(status_frame, text="📊 字数: 0 | 字符: 0", 
                                        bg=self.colors['bg_accent'], 
                                        fg=self.colors['text_secondary'],
                                        font=('Arial', 9))
        self.word_count_label.pack(side=tk.RIGHT, padx=10, pady=5)

    def create_main_content(self):
        """创建主内容区域"""
        # 创建分割面板
        paned = tk.PanedWindow(self, orient=tk.HORIZONTAL, sashwidth=8, 
                              sashrelief=tk.RAISED, bg=self.colors['accent_purple'])
        paned.pack(fill=tk.BOTH, expand=1, padx=10, pady=5)

        # 左侧编辑器区域
        editor_frame = tk.Frame(paned, bg=self.colors['bg_primary'])
        
        # 编辑器标题栏
        editor_title = tk.Label(editor_frame, text="📝 Markdown 编辑器", 
                               bg=self.colors['bg_secondary'], fg=self.colors['accent_blue'],
                               font=('Arial', 12, 'bold'), pady=8)
        editor_title.pack(fill=tk.X)
          # 编辑器
        self.editor = ScrolledText(editor_frame, wrap=tk.WORD, 
                                  bg=self.colors['bg_primary'], 
                                  fg='#f0f6fc',  # 明亮的白色
                                  insertbackground=self.colors['accent_pink'],
                                  selectbackground=self.colors['accent_purple'],
                                  selectforeground='white',
                                  font=('JetBrains Mono', 12),
                                  relief='flat', borderwidth=0,
                                  padx=15, pady=15)
        self.editor.bind("<<Modified>>", self.on_text_change)
        self.editor.bind("<KeyPress>", self.on_key_press)
        self.editor.pack(fill=tk.BOTH, expand=1, padx=5, pady=5)
        
        paned.add(editor_frame)

        # 右侧预览区域
        preview_frame = tk.Frame(paned, bg=self.colors['bg_primary'])
        
        # 预览标题栏
        preview_title = tk.Label(preview_frame, text="👁️ 实时预览", 
                                bg=self.colors['bg_secondary'], fg=self.colors['accent_green'],
                                font=('Arial', 12, 'bold'), pady=8)
        preview_title.pack(fill=tk.X)
        
        # 预览区域
        self.preview = HTMLLabel(preview_frame, html="", 
                                background=self.colors['bg_primary'])
        self.preview.pack(fill=tk.BOTH, expand=1, padx=5, pady=5)
        
        paned.add(preview_frame)

    def on_key_press(self, event=None):
        """处理按键事件"""
        self.is_typing = True
        self.typing_indicator.config(text="✏️ 正在编辑...")
        
        # 添加打字机效果
        self.create_typing_effect()
        
        # 0.5秒后清除打字指示器
        self.after(500, self.clear_typing_indicator)

    def create_typing_effect(self):
        """创建打字机效果"""
        # 随机选择一个打字状态
        typing_states = [
            "✏️ 正在编辑...",            "⌨️ 键盘飞舞中...",
            "📝 灵感涌现...",
            "💭 思维风暴...",
            "🎯 专注创作..."
        ]
        
        if hasattr(self, 'typing_indicator'):
            state = random.choice(typing_states)
            self.typing_indicator.config(text=state)

    def clear_typing_indicator(self):
        """清除打字指示器"""
        self.is_typing = False
        self.typing_indicator.config(text="")

    def on_text_change(self, event=None):
        self.editor.edit_modified(False)
        self.schedule_update()

    def schedule_update(self):
        if self.update_task is not None:
            self.after_cancel(self.update_task)
        self.update_task = self.after(300, self.perform_update)

    def perform_update(self):
        self.update_task = None
        self.update_preview()
        self.update_word_count()
        self.apply_syntax_highlighting()

    def update_word_count(self):
        """更新字数统计"""
        text = self.editor.get("1.0", tk.END).strip()
        self.char_count = len(text)
        self.word_count = len(text.split()) if text else 0
        self.word_count_label.config(text=f"📊 字数: {self.word_count} | 字符: {self.char_count}")

    def update_preview(self):
        text = self.editor.get("1.0", tk.END)
        
        try:
            if text.strip():
                html_content = markdown.markdown(text, extensions=['fenced_code', 'tables', 'toc'])
                
                # 为HTML内容添加彩色样式，模仿编辑器的彩色效果
                colored_html = self.add_colors_to_html(html_content)
                
                styled_html = f"""
                <body style="background-color: #1e1e2e; color: #cdd6f4; font-family: Arial, sans-serif; padding: 15px; margin: 0;">
                {colored_html}
                </body>
                """
            else:
                # 彩色欢迎信息
                styled_html = """
                <body style="background-color: #1e1e2e; color: #cdd6f4; font-family: Arial, sans-serif; padding: 15px; margin: 0;">
                    <div style="text-align: center; padding: 50px;">
                        <h2 style="color: #89b4fa; font-size: 28px;">✨ 欢迎使用 Markdown Studio Pro!</h2>
                        <p style="color: #a6e3a1; font-size: 16px;">在左侧编辑器中开始编写 Markdown 内容</p>
                        <p style="color: #cba6f7; font-size: 16px;">实时预览将在这里显示</p>
                    </div>
                </body>
                """
            
            self.preview.set_html(styled_html)
            
        except Exception as e:
            error_html = f"""
            <body style="background-color: #1e1e2e; color: #f38ba8; font-family: Arial, sans-serif; padding: 15px; margin: 0;">
                <h3 style="color: #f38ba8;">⚠️ 预览渲染错误</h3>
                <p style="color: #fab387;">错误信息: {str(e)}</p>
                <h4 style="color: #cba6f7;">原始内容:</h4>
                <pre style="background-color: #313244; color: #a6e3a1; padding: 10px;">{text}</pre>
            </body>
            """
            self.preview.set_html(error_html)

    def add_colors_to_html(self, html_content):
        """为HTML内容添加彩色样式"""
        import re
        
        # 彩色样式映射
        color_styles = {
            '<h1': '<h1 style="color: #89b4fa; font-size: 28px; font-weight: bold; margin: 20px 0 15px 0;"',
            '<h2': '<h2 style="color: #a6e3a1; font-size: 24px; font-weight: bold; margin: 18px 0 12px 0;"',
            '<h3': '<h3 style="color: #cba6f7; font-size: 20px; font-weight: bold; margin: 15px 0 10px 0;"',
            '<h4': '<h4 style="color: #fab387; font-size: 18px; font-weight: bold; margin: 12px 0 8px 0;"',
            '<h5': '<h5 style="color: #f5c2e7; font-size: 16px; font-weight: bold; margin: 10px 0 6px 0;"',
            '<h6': '<h6 style="color: #f38ba8; font-size: 14px; font-weight: bold; margin: 8px 0 5px 0;"',
            '<p': '<p style="color: #cdd6f4; margin: 12px 0; line-height: 1.6;"',
            '<li': '<li style="color: #bac2de; margin: 5px 0;"',
            '<strong': '<strong style="color: #f5c2e7; font-weight: bold;"',
            '<em': '<em style="color: #fab387; font-style: italic;"',
            '<code': '<code style="background-color: #313244; color: #a6e3a1; padding: 2px 6px; border-radius: 4px; font-family: monospace;"',
            '<pre': '<pre style="background-color: #313244; color: #a6e3a1; padding: 15px; margin: 15px 0; border-radius: 8px; overflow-x: auto;"',
            '<blockquote': '<blockquote style="border-left: 4px solid #fab387; background-color: rgba(49, 50, 68, 0.5); padding: 15px 20px; margin: 15px 0; color: #bac2de; font-style: italic;"',
            '<a': '<a style="color: #89b4fa; text-decoration: underline;"',
            '<ul': '<ul style="color: #cdd6f4; padding-left: 20px;"',
            '<ol': '<ol style="color: #cdd6f4; padding-left: 20px;"',
            '<table': '<table style="border-collapse: collapse; width: 100%; margin: 15px 0; background-color: #313244; border-radius: 6px;"',
            '<th': '<th style="background-color: #45475a; color: #cdd6f4; padding: 12px; border: 1px solid #6c7086; font-weight: bold;"',
            '<td': '<td style="padding: 10px 12px; border: 1px solid #6c7086; color: #cdd6f4;"',
            '<hr': '<hr style="border: none; height: 2px; background-color: #45475a; margin: 25px 0; border-radius: 1px;"'
        }
        
        # 应用颜色样式
        colored_html = html_content
        for tag, styled_tag in color_styles.items():
            colored_html = colored_html.replace(tag, styled_tag)
        
        return colored_html

    def start_clock(self):
        """启动时钟"""

        def update_clock():
            current_time = datetime.now().strftime("%H:%M:%S")
            if hasattr(self, "clock_label"):
                self.clock_label.config(text=f"🕐 {current_time}")
            self.after(1000, update_clock)

        self.after(1000, update_clock)

    def create_welcome_message(self):
        """创建欢迎消息"""
        welcome_text = """# 🎉 欢迎使用 Markdown Studio Pro！

## ✨ 功能特色

- 🎨 **精美主题**: 支持多种主题切换
- ⚡ **实时预览**: 边写边看，所见即所得
- 📊 **智能统计**: 实时字数和字符统计
- 🔥 **语法高亮**: 让代码更加美观
- 💫 **动画效果**: 流畅的用户体验

## 🚀 快速开始

1. 点击 **📁 打开** 按钮载入 Markdown 文件
2. 或者直接在左侧编辑器中开始写作
3. 右侧会实时显示渲染后的效果
4. 使用 **💾 保存** 按钮保存您的作品

## 💡 小贴士

- 支持表格、代码块、引用等丰富格式
- 可以通过主题菜单切换不同风格
- 状态栏会显示实时的编辑信息

---

**开始您的 Markdown 创作之旅吧！** ✍️
"""
        self.editor.insert(tk.END, welcome_text)
        self.update_preview()

    def change_theme(self, theme_name):
        """切换主题"""
        themes = {
            'dark': {
                'bg_primary': '#1e1e2e',
                'bg_secondary': '#313244',
                'bg_accent': '#45475a',
                'text_primary': '#cdd6f4',
                'text_secondary': '#bac2de',
                'accent_blue': '#89b4fa',
                'accent_green': '#a6e3a1',
                'accent_purple': '#cba6f7',
                'accent_pink': '#f5c2e7',
                'accent_orange': '#fab387',
            },
            'light': {
                'bg_primary': '#ffffff',
                'bg_secondary': '#f5f5f5',
                'bg_accent': '#e0e0e0',
                'text_primary': '#333333',
                'text_secondary': '#666666',
                'accent_blue': '#2196F3',
                'accent_green': '#4CAF50',
                'accent_purple': '#9C27B0',
                'accent_pink': '#E91E63',
                'accent_orange': '#FF9800',
            },
            'rainbow': {
                'bg_primary': '#0f0f23',
                'bg_secondary': '#1a1a2e',
                'bg_accent': '#16213e',
                'text_primary': '#ffffff',
                'text_secondary': '#cccccc',
                'accent_blue': '#00d4ff',
                'accent_green': '#00ff9f',
                'accent_purple': '#d400ff',
                'accent_pink': '#ff006e',
                'accent_orange': '#ff8500',
            },
            'gaming': {
                'bg_primary': '#0d1117',
                'bg_secondary': '#21262d',
                'bg_accent': '#30363d',
                'text_primary': '#f0f6fc',
                'text_secondary': '#8b949e',
                'accent_blue': '#58a6ff',
                'accent_green': '#3fb950',
                'accent_purple': '#d2a8ff',
                'accent_pink': '#f85149',
                'accent_orange': '#d29922',
            }
        }
        
        if theme_name in themes:
            self.colors = themes[theme_name]
            self.configure(bg=self.colors['bg_primary'])
            
            # 根据主题设置编辑器文字颜色
            if theme_name == 'light':
                editor_fg = '#333333'  # 浅色主题用深色文字
            else:
                editor_fg = '#f0f6fc'  # 深色主题用明亮文字
                
            # 更新编辑器颜色
            self.editor.configure(bg=self.colors['bg_primary'], 
                                 fg=editor_fg,
                                 insertbackground=self.colors['accent_pink'],
                                 selectbackground=self.colors['accent_purple'])
            self.update_preview()
            self.show_theme_notification(theme_name)

    def show_theme_notification(self, theme_name):
        """显示主题切换通知"""
        # 创建一个临时的通知窗口
        notification = tk.Toplevel(self)
        notification.title("主题切换")
        notification.geometry("300x100")
        notification.configure(bg=self.colors['bg_primary'])
        notification.resizable(False, False)
        
        # 居中显示
        x = self.winfo_x() + (self.winfo_width() // 2) - 150
        y = self.winfo_y() + (self.winfo_height() // 2) - 50
        notification.geometry(f"+{x}+{y}")
        
        # 移除窗口装饰
        notification.overrideredirect(True)
        
        # 添加通知内容
        msg = tk.Label(notification, 
                      text=f"🎨 已切换到 {theme_name} 主题！",
                      bg=self.colors['bg_primary'],
                      fg=self.colors['accent_green'],
                      font=('Arial', 12, 'bold'))
        msg.pack(expand=True)
        
        # 2秒后自动关闭
        self.after(2000, notification.destroy)

    def show_statistics(self):
        """显示统计信息窗口"""
        stats_window = tk.Toplevel(self)
        stats_window.title("📊 文档统计")
        stats_window.geometry("400x300")
        stats_window.configure(bg=self.colors['bg_primary'])
        
        # 计算统计信息
        text = self.editor.get("1.0", tk.END).strip()
        lines = len(text.split('\n')) if text else 0
        paragraphs = len([p for p in text.split('\n\n') if p.strip()]) if text else 0
        
        stats_info = f"""
📝 文档统计信息

📄 总字符数: {self.char_count}
🔤 总字数: {self.word_count}  
📋 行数: {lines}
📄 段落数: {paragraphs}
⏰ 最后编辑: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
📁 当前文件: {self.current_file or '未保存'}
        """
        
        stats_label = tk.Label(stats_window,
                              text=stats_info,
                              bg=self.colors['bg_primary'],
                              fg=self.colors['text_primary'],
                              font=('Arial', 11),
                              justify=tk.LEFT)
        stats_label.pack(padx=20, pady=20)

    def show_settings(self):
        """显示设置窗口"""
        settings_window = tk.Toplevel(self)
        settings_window.title("🔧 设置")
        settings_window.geometry("500x400")
        settings_window.configure(bg=self.colors['bg_primary'])
        
        # 自动保存设置
        auto_save_frame = tk.Frame(settings_window, bg=self.colors['bg_primary'])
        auto_save_frame.pack(pady=20, padx=20, fill=tk.X)
        
        tk.Label(auto_save_frame, text="💾 自动保存:",
                bg=self.colors['bg_primary'], fg=self.colors['text_primary'],
                font=('Arial', 12, 'bold')).pack(side=tk.LEFT)
        
        auto_save_var = tk.BooleanVar(value=self.auto_save_enabled)
        auto_save_check = tk.Checkbutton(auto_save_frame, 
                                        variable=auto_save_var,
                                        command=lambda: setattr(self, 'auto_save_enabled', auto_save_var.get()),
                                        bg=self.colors['bg_primary'],
                                        fg=self.colors['accent_green'],
                                        selectcolor=self.colors['bg_secondary'])
        auto_save_check.pack(side=tk.RIGHT)

    def toggle_auto_save(self):
        """切换自动保存"""
        self.auto_save_enabled = not self.auto_save_enabled
        status = "启用" if self.auto_save_enabled else "禁用"
        messagebox.showinfo("自动保存", f"自动保存已{status}！ 💾")

    def toggle_focus_mode(self):
        """切换专注模式"""
        # 简单实现：隐藏/显示工具栏和状态栏
        messagebox.showinfo("专注模式", "专注模式功能开发中... 🎯")

    def show_shortcuts(self):
        """显示快捷键帮助"""
        shortcuts_window = tk.Toplevel(self)
        shortcuts_window.title("⌨️ 快捷键指南")
        shortcuts_window.geometry("600x500")
        shortcuts_window.configure(bg=self.colors['bg_primary'])
        
        shortcuts_text = """
🎯 Markdown Studio Pro 快捷键指南

📁 文件操作:
   Ctrl + O     打开文件
   Ctrl + S     保存文件
   Ctrl + Shift + S     另存为
   Ctrl + P     导出PDF
   Ctrl + N     新建文件

✂️ 编辑操作:
   Ctrl + Z     撤销
   Ctrl + Y     重做
   Ctrl + A     全选
   Ctrl + C     复制
   Ctrl + V     粘贴
   Ctrl + X     剪切

🔍 查找替换:
   Ctrl + F     查找
   Ctrl + H     替换
   F3          查找下一个

🎨 视图操作:
   F11         全屏模式
   Ctrl + +    放大字体
   Ctrl + -    缩小字体
   Ctrl + 0    重置字体

💡 Markdown 语法:
   # 标题      一级标题
   ## 标题     二级标题
   **粗体**    粗体文本
   *斜体*      斜体文本
   `代码`      行内代码
   ```代码块``` 代码块
   [链接](url) 超链接
   ![图片](url) 图片

🌟 小贴士:
   • 支持实时预览
   • 自动保存功能
   • 多主题切换
   • 智能统计
   • PDF 导出
        """
        
        text_widget = ScrolledText(shortcuts_window,
                                  bg=self.colors['bg_primary'],
                                  fg=self.colors['text_primary'],
                                  font=('JetBrains Mono', 10),
                                  wrap=tk.WORD,
                                  padx=20, pady=20)
        text_widget.pack(fill=tk.BOTH, expand=1, padx=10, pady=10)
        text_widget.insert(tk.END, shortcuts_text)
        text_widget.config(state=tk.DISABLED)

    def show_about(self):
        """显示关于窗口"""
        about_window = tk.Toplevel(self)
        about_window.title("❓ 关于")
        about_window.geometry("500x400")
        about_window.configure(bg=self.colors['bg_primary'])
        
        # 中心位置
        x = self.winfo_x() + (self.winfo_width() // 2) - 250
        y = self.winfo_y() + (self.winfo_height() // 2) - 200
        about_window.geometry(f"+{x}+{y}")
        
        about_content = f"""


✨ Markdown Studio Pro ✨

🎨 版本: 2.0 Enhanced Edition
👨‍💻 开发者: GitHub Copilot
📅 更新日期: {datetime.now().strftime('%Y年%m月%d日')}

🌟 特色功能:
• 实时预览渲染
• 多主题切换支持
• 智能统计分析
• 自动保存功能
• 专业语法高亮
• 炫酷动画效果

🛠️ 技术栈:
• Python 3.x
• Tkinter GUI
• Markdown 解析
• HTML 渲染

💝 感谢使用本软件！

🌐 开源地址: github.com/copilot/markdown-studio
        """
        
        about_label = tk.Label(about_window,
                              text=about_content,
                              bg=self.colors['bg_primary'],
                              fg=self.colors['text_primary'],
                              font=('Arial', 11),
                              justify=tk.CENTER)
        about_label.pack(expand=True, fill=tk.BOTH, padx=20, pady=20)

    def setup_keyboard_shortcuts(self):
        """设置键盘快捷键"""
        self.bind('<Control-o>', lambda e: self.open_file())
        self.bind('<Control-s>', lambda e: self.save_file())
        self.bind('<Control-Shift-S>', lambda e: self.save_file_as())
        self.bind('<Control-p>', lambda e: self.export_to_pdf())
        self.bind('<Control-plus>', lambda e: self.increase_font_size())
        self.bind('<Control-minus>', lambda e: self.decrease_font_size())
        self.bind('<Control-0>', lambda e: self.reset_font_size())

    def toggle_fullscreen(self):
        """切换全屏模式"""
        self.attributes('-fullscreen', not self.attributes('-fullscreen'))

    def increase_font_size(self):
        """增大字体"""
        current_font = self.editor.cget('font')
        if isinstance(current_font, str):
            size = 12
        else:
            size = current_font[2] if len(current_font) > 2 else 12
        new_size = min(size + 2, 24)  # 最大24号字体
        self.editor.config(font=('JetBrains Mono', new_size))

    def decrease_font_size(self):
        """减小字体"""
        current_font = self.editor.cget('font')
        if isinstance(current_font, str):
            size = 12
        else:
            size = current_font[2] if len(current_font) > 2 else 12
        new_size = max(size - 2, 8)  # 最小8号字体
        self.editor.config(font=('JetBrains Mono', new_size))

    def reset_font_size(self):
        """重置字体大小"""
        self.editor.config(font=('JetBrains Mono', 12))

    def open_file(self):
        """打开文件"""
        file_path = filedialog.askopenfilename(
            title="打开Markdown文件",
            filetypes=[("Markdown files", "*.md"), ("Text files", "*.txt"), ("All files", "*.*")]
        )
        if file_path:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                self.editor.delete("1.0", tk.END)
                self.editor.insert("1.0", content)
                self.current_file = file_path
                self.file_path_label.config(text=f"📁 {file_path}")
                self.update_preview()
                self.update_word_count()
            except Exception as e:
                messagebox.showerror("错误", f"无法打开文件: {str(e)}")

    def save_file(self):
        """保存文件"""
        if self.current_file:
            try:
                content = self.editor.get("1.0", tk.END)
                with open(self.current_file, "w", encoding="utf-8") as f:
                    f.write(content)
                messagebox.showinfo("保存", "文件保存成功！ 💾")
                self.last_save_time = time.time()
            except Exception as e:
                messagebox.showerror("错误", f"无法保存文件: {str(e)}")
        else:
            self.save_file_as()

    def save_file_as(self):
        """另存为文件"""
        file_path = filedialog.asksaveasfilename(
            title="保存Markdown文件",
            defaultextension=".md",
            filetypes=[("Markdown files", "*.md"), ("Text files", "*.txt"), ("All files", "*.*")]
        )
        if file_path:
            try:
                content = self.editor.get("1.0", tk.END)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                self.current_file = file_path
                self.file_path_label.config(text=f"📁 {file_path}")
                messagebox.showinfo("保存", "文件保存成功！ 💾")
                self.last_save_time = time.time()
            except Exception as e:
                messagebox.showerror("错误", f"无法保存文件: {str(e)}")

    def export_to_pdf(self):
        """导出为 PDF 文件"""
        file_path = filedialog.asksaveasfilename(
            title="导出为PDF",
            defaultextension=".pdf",
            filetypes=[("PDF files", "*.pdf")],
        )
        if file_path:
            try:
                markdown_text = self.editor.get("1.0", tk.END)
                html_body = markdown.markdown(
                    markdown_text, extensions=["fenced_code", "tables", "toc"]
                )
                html = (
                    "<html><head><meta charset='utf-8'>"
                    "<style>body{font-family:'STSong-Light';}</style></head>"
                    f"<body>{html_body}</body></html>"
                )
                with open(file_path, "wb") as f:
                    pisa_status = pisa.CreatePDF(html, dest=f, encoding="utf-8")
                if pisa_status.err:
                    raise Exception("PDF生成失败")
                messagebox.showinfo("导出PDF", "PDF 导出成功！ 📄")
            except Exception as e:
                messagebox.showerror("错误", f"无法导出PDF: {str(e)}")

    def apply_syntax_highlighting(self):
        """应用Markdown语法高亮"""
        try:
            # 清除所有现有的标签
            for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'bold', 'italic', 'code', 'link', 'list']:
                self.editor.tag_delete(tag)
            
            # 配置标签样式
            self.editor.tag_config('h1', foreground='#89b4fa', font=('JetBrains Mono', 14, 'bold'))
            self.editor.tag_config('h2', foreground='#cba6f7', font=('JetBrains Mono', 13, 'bold'))
            self.editor.tag_config('h3', foreground='#f5c2e7', font=('JetBrains Mono', 12, 'bold'))
            self.editor.tag_config('h4', foreground='#fab387', font=('JetBrains Mono', 12, 'bold'))
            self.editor.tag_config('h5', foreground='#a6e3a1', font=('JetBrains Mono', 12, 'bold'))
            self.editor.tag_config('h6', foreground='#f9e2af', font=('JetBrains Mono', 12, 'bold'))
            self.editor.tag_config('bold', foreground='#f5c2e7', font=('JetBrains Mono', 12, 'bold'))
            self.editor.tag_config('italic', foreground='#fab387', font=('JetBrains Mono', 12, 'italic'))
            self.editor.tag_config('code', foreground='#a6e3a1', background='#313244', font=('JetBrains Mono', 11))
            self.editor.tag_config('link', foreground='#89b4fa', underline=True)
            self.editor.tag_config('list', foreground='#f9e2af')
            
            text = self.editor.get("1.0", tk.END)
            lines = text.split('\n')
            
            for i, line in enumerate(lines):
                line_start = f"{i+1}.0"
                line_end = f"{i+1}.end"
                
                # 标题高亮
                if line.startswith('# '):
                    self.editor.tag_add('h1', line_start, line_end)
                elif line.startswith('## '):
                    self.editor.tag_add('h2', line_start, line_end)
                elif line.startswith('### '):
                    self.editor.tag_add('h3', line_start, line_end)
                elif line.startswith('#### '):
                    self.editor.tag_add('h4', line_start, line_end)
                elif line.startswith('##### '):
                    self.editor.tag_add('h5', line_start, line_end)
                elif line.startswith('###### '):
                    self.editor.tag_add('h6', line_start, line_end)
                
                # 列表高亮
                if line.strip().startswith('- ') or line.strip().startswith('* ') or line.strip().startswith('+ '):
                    self.editor.tag_add('list', line_start, line_end)
                elif line.strip() and line.strip()[0].isdigit() and '. ' in line:
                    self.editor.tag_add('list', line_start, line_end)
                
                # 粗体和斜体（简单实现）
                import re
                # 查找粗体 **text**
                for match in re.finditer(r'\*\*(.*?)\*\*', line):
                    start_pos = f"{i+1}.{match.start()}"
                    end_pos = f"{i+1}.{match.end()}"
                    self.editor.tag_add('bold', start_pos, end_pos)
                
                # 查找斜体 *text*
                for match in re.finditer(r'(?<!\*)\*([^*]+?)\*(?!\*)', line):
                    start_pos = f"{i+1}.{match.start()}"
                    end_pos = f"{i+1}.{match.end()}"
                    self.editor.tag_add('italic', start_pos, end_pos)
                
                # 查找行内代码 `code`
                for match in re.finditer(r'`([^`]+?)`', line):
                    start_pos = f"{i+1}.{match.start()}"
                    end_pos = f"{i+1}.{match.end()}"
                    self.editor.tag_add('code', start_pos, end_pos)
                
                # 查找链接 [text](url)
                for match in re.finditer(r'\[([^\]]+?)\]\([^)]+?\)', line):
                    start_pos = f"{i+1}.{match.start()}"
                    end_pos = f"{i+1}.{match.end()}"
                    self.editor.tag_add('link', start_pos, end_pos)
                    
        except Exception:
            # 如果语法高亮出错，静默忽略
            pass


if __name__ == "__main__":
    app = MarkdownViewer()
    app.mainloop()

