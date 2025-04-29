// Electron main process for Fair Note
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  // Cria a janela de splash
  const splash = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    center: true,
    resizable: false,
    skipTaskbar: true,
    show: true,
  });
  splash.loadFile(path.join(__dirname, "public", "splash.html"));

  // Cria a janela principal, mas não mostra ainda
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 436,
    minHeight: 780,
    show: false, // Hide until ready
    backgroundColor: "#000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "public", "icon-512x512.png"),
    title: "Кот-note",
  });

  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";
  win.loadURL(startUrl).catch((err) => {
    win.loadURL(
      "data:text/html,<h2>Failed to load app. Is the Next.js server running?</h2><pre>" +
        err +
        "</pre>",
    );
  });

  const userLocale = app.getLocale(); // e.g., 'ja'
  win.webContents.on("did-finish-load", () => {
    win.webContents.send("set-locale", userLocale);
  });

  // Quando a janela principal estiver pronta, fecha o splash e mostra o app
  win.once("ready-to-show", () => {
    setTimeout(() => {
      splash.destroy();
      win.show();
    }, 9500); // 1500ms = 1.5 segundos
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
