const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let currentFilePath = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: '✨ Markdown Studio Pro ✨',
        backgroundColor: '#1e1e2e',
        icon: path.join(__dirname, 'mca.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        show: false
    });

    mainWindow.loadFile('index.html');

    // 窗口准备好后显示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 创建菜单
    createMenu();

    // 开发模式下打开开发者工具
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 处理窗口标题动画
    startTitleAnimation();
}

function startTitleAnimation() {
    const titles = [
        '✨ Markdown Studio Pro ✨',
        '🌟 Markdown Studio Pro 🌟',
        '💫 Markdown Studio Pro 💫',
        '⭐ Markdown Studio Pro ⭐',
        '🎆 Markdown Studio Pro 🎆'
    ];
    let index = 0;

    setInterval(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setTitle(titles[index]);
            index = (index + 1) % titles.length;
        }
    }, 2000);
}

function createMenu() {
    const template = [
        {
            label: '📂 文件',
            submenu: [
                {
                    label: '📑 新建标签页',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => newTab()
                },
                {
                    label: '✖ 关闭标签页',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => closeCurrentTab()
                },
                { type: 'separator' },
                {
                    label: '📁 打开',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => openFile()
                },
                {
                    label: '💾 保存',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => saveFile()
                },
                {
                    label: '📝 另存为',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => saveFileAs()
                },
                {
                    label: '📄 导出PDF',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => exportToPDF()
                },
                { type: 'separator' },
                {
                    label: '🚪 退出',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: '🎨 主题',
            submenu: [
                {
                    label: '🌙 暗黑主题',
                    click: () => changeTheme('dark')
                },
                {
                    label: '☀️ 明亮主题',
                    click: () => changeTheme('light')
                },
                {
                    label: '🌈 彩虹主题',
                    click: () => changeTheme('rainbow')
                },
                {
                    label: '🎮 游戏主题',
                    click: () => changeTheme('gaming')
                }
            ]
        },
        {
            label: '🛠️ 工具',
            submenu: [
                {
                    label: '📊 统计信息',
                    click: () => showStatistics()
                },
                {
                    label: '🔧 设置',
                    click: () => showSettings()
                },
                {
                    label: '💾 自动保存',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem) => toggleAutoSave(menuItem.checked)
                },
                {
                    label: '🎯 专注模式',
                    accelerator: 'CmdOrCtrl+Shift+F',
                    type: 'checkbox',
                    checked: false,
                    click: () => toggleFocusMode()
                },
                { type: 'separator' },
                {
                    label: '📷 OCR识别',
                    click: () => ocrImage()
                },
                { type: 'separator' },
                {
                    label: '⌨️ 快捷键',
                    click: () => showShortcuts()
                },
                {
                    label: '❓ 关于',
                    click: () => showAbout()
                }
            ]
        },
        {
            label: '🔍 视图',
            submenu: [
                {
                    label: '🔍 放大',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => mainWindow.webContents.send('zoom-in')
                },
                {
                    label: '🔍 缩小',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => mainWindow.webContents.send('zoom-out')
                },
                {
                    label: '🔍 重置',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => mainWindow.webContents.send('zoom-reset')
                },
                { type: 'separator' },
                {
                    label: '全屏',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                { type: 'separator' },
                {
                    label: '开发者工具',
                    accelerator: 'F12',
                    click: () => mainWindow.webContents.toggleDevTools()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 打开文件
async function openFile() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: '打开Markdown文件',
        filters: [
            { name: 'Markdown files', extensions: ['md', 'markdown'] },
            { name: 'Text files', extensions: ['txt'] },
            { name: 'All files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            currentFilePath = filePath;
            mainWindow.webContents.send('file-opened', { path: filePath, content: content });
        } catch (error) {
            dialog.showErrorBox('错误', `无法打开文件: ${error.message}`);
        }
    }
}

// 保存文件
async function saveFile() {
    if (currentFilePath) {
        mainWindow.webContents.send('save-file', currentFilePath);
    } else {
        saveFileAs();
    }
}

// 另存为
async function saveFileAs() {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: '保存Markdown文件',
        defaultPath: 'untitled.md',
        filters: [
            { name: 'Markdown files', extensions: ['md', 'markdown'] },
            { name: 'Text files', extensions: ['txt'] },
            { name: 'All files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        currentFilePath = result.filePath;
        mainWindow.webContents.send('save-file', result.filePath);
    }
}

// 导出PDF
async function exportToPDF() {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: '导出为PDF',
        defaultPath: 'document.pdf',
        filters: [
            { name: 'PDF files', extensions: ['pdf'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        mainWindow.webContents.send('export-pdf', result.filePath);
    }
}

// 新建标签页
function newTab() {
    mainWindow.webContents.send('new-tab');
}

// 关闭当前标签页
function closeCurrentTab() {
    mainWindow.webContents.send('close-tab');
}

// 切换主题
function changeTheme(themeName) {
    mainWindow.webContents.send('change-theme', themeName);
}

// 显示统计信息
function showStatistics() {
    mainWindow.webContents.send('show-statistics');
}

// 显示设置
function showSettings() {
    mainWindow.webContents.send('show-settings');
}

// 切换自动保存
function toggleAutoSave(enabled) {
    mainWindow.webContents.send('toggle-auto-save', enabled);
}

// 切换专注模式
function toggleFocusMode() {
    mainWindow.webContents.send('toggle-focus-mode');
}

// OCR识别
async function ocrImage() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: '选择要识别的图片',
        filters: [
            { name: 'Image files', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif'] },
            { name: 'All files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        mainWindow.webContents.send('ocr-image', result.filePaths);
    }
}

// 显示快捷键
function showShortcuts() {
    mainWindow.webContents.send('show-shortcuts');
}

// 显示关于
function showAbout() {
    mainWindow.webContents.send('show-about');
}

// IPC 事件处理
ipcMain.on('save-file-content', (event, { path, content }) => {
    try {
        fs.writeFileSync(path, content, 'utf-8');
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '保存',
            message: '文件保存成功！ 💾',
            buttons: ['确定']
        });
    } catch (error) {
        dialog.showErrorBox('错误', `无法保存文件: ${error.message}`);
    }
});

ipcMain.on('export-pdf-content', async (event, { path, html }) => {
    try {
        const pdfData = await mainWindow.webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4',
            margins: {
                top: 1,
                bottom: 1,
                left: 1,
                right: 1
            }
        });
        fs.writeFileSync(path, pdfData);
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '导出PDF',
            message: 'PDF 导出成功！ 📄',
            buttons: ['确定']
        });
    } catch (error) {
        dialog.showErrorBox('错误', `无法导出PDF: ${error.message}`);
    }
});

ipcMain.on('show-message', (event, { type, title, message }) => {
    dialog.showMessageBox(mainWindow, {
        type: type,
        title: title,
        message: message,
        buttons: ['确定']
    });
});

ipcMain.on('show-error', (event, { title, message }) => {
    dialog.showErrorBox(title, message);
});

// 工具栏按钮转发的菜单动作
ipcMain.on('menu-action', (event, action) => {
    if (action === 'open-file') openFile();
    else if (action === 'save-file-as') saveFileAs();
    else if (action === 'export-pdf') exportToPDF();
});

// 应用生命周期
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
