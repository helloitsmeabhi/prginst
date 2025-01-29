import { app, BrowserWindow,ipcMain,dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { fileURLToPath } from 'url';
import { exec, execFile } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the directory name of the file
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}
let mainWindow;
let dialogWindow;
const createWindow = () => {
  // Create the browser window.
    mainWindow = new BrowserWindow({
    show: false,
    icon: path.join(__dirname,'/assets/images/p.png'),
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // For security
      nodeIntegration: false, // Node integration is disabled
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.maximize();
  mainWindow.show();
  
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};


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
ipcMain.on('close', () => {
  app.quit();
});

ipcMain.on('minimize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.restore();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle('run-powershell-command', async (event) => {
  return new Promise((resolve, reject) => {
      // Chain multiple PowerShell commands using ";"
      const command = 'powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser;  Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression"';

      exec(command, (error, stdout, stderr) => {
          if (error) {
              reject(`Error: ${error.message}`);
              dialog.showErrorBox('Error', `Error: ${error.message}`); // Show error in a pop-up
              return;
          }
          if (stderr) {
              reject(`Stderr: ${stderr}`);
              dialog.showErrorBox('Error', `Stderr: ${stderr}`); // Show stderr in a pop-up
              return;
          }

          // Show the output in a pop-up window
          dialog.showMessageBox({
              type: 'info',
              title: 'PowerShell Output',
              message: 'Command Output:',
              detail: stdout, // Display the stdout in the pop-up
              buttons: ['OK']
          });

          resolve(stdout); // Resolve the promise with the output
      });
  });
});

function createDialog() {
  dialogWindow = new BrowserWindow({
      width: 600,
      height: 400,
      show: false,
      parent: mainWindow,
      modal: true,
      frame: false,
      transparent: true,
      autoHideMenuBar: true,
      backgroundColor: '#00000000',
      webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
      }
  });
  dialogWindow.loadFile(path.join(__dirname,'dialog.html'));
  dialogWindow.show();
  dialogWindow.on('closed', () => {
      dialogWindow = null;
  });
}

ipcMain.handle('open-command-dialog', () => {
  createDialog();
  return true;
});

// Create a command map for different languages
const commandMap = {
  go: 'scoop install go',
  cppc: 'scoop install msvc',
  cs: 'scoop install dotnet-sdk',
  java: 'scoop install openjdk',
  python: 'sccop install python',
  node: 'scoop install nodejs',
  vsc:'scop install vscode',
  vs:'scoop install visualstudio',
  eclipse:'scoop install eclipse',
  pycharm:'scoop install pycharm',
  arduino:'scoop install arduino',
  android:'scoop install android-studio',
  mysql:'scoop install mysql',
  mongo:'scoop install mongodb',
  postgre:'scoop install postgresql',
  maria:'scoop install mariadb',
  fire:'scoop install firebase',
  nosql:'scoop install nosql',
  django:'scoop install django',
  dotnet:'scoop install dotnet',
  react:'scoop install react',
  electronjs:'scoop install electron',
  spring:'scoop install spring',
  flask:'scoop install flask',
};

ipcMain.handle('run-command', (event, language) => {
  return new Promise((resolve, reject) => {
      if (!commandMap[language]) {
          reject(`No command defined for ${language}`);
          return;
      }

      const child = exec(`powershell -Command "${commandMap[language]}"`);

      child.stdout.on('data', (data) => {
          if (dialogWindow) {
              dialogWindow.webContents.send('command-output', data);
          }
      });

      child.stderr.on('data', (data) => {
          if (dialogWindow) {
              dialogWindow.webContents.send('command-output', `ERROR: ${data}`);
          }
      });

      child.on('close', (code) => {
          if (dialogWindow) {
              dialogWindow.webContents.send('command-complete', code);
          }
          resolve(code);
      });
  });
});
ipcMain.handle('install-package', (event, packageName) => {
  return new Promise((resolve, reject) => {
      if (!packageName) {
          reject(`No command defined for ${packageName}`);
          return;
      }

      const child = exec(`powershell -Command "scoop install ${packageName}"`);

      child.stdout.on('data', (data) => {
          if (dialogWindow) {
              dialogWindow.webContents.send('command-output', data);
          }
      });

      child.stderr.on('data', (data) => {
          if (dialogWindow) {
              dialogWindow.webContents.send('command-output', `ERROR: ${data}`);
          }
      });

      child.on('close', (code) => {
          if (dialogWindow) {
              dialogWindow.webContents.send('command-complete', code);
          }
          resolve(code);
      });
  });
});
ipcMain.handle('scoop-search', async (event, query) => {
  return new Promise((resolve, reject) => {
      exec(`powershell -Command "scoop search ${query}"`, (error, stdout) => {
          if (error) {
              reject('Error executing Scoop search');
              return;
          }

          const lines = stdout.split('\n').slice(2); // Ignore headers
          const results = lines.map(line => {
              const columns = line.split(/\s{2,}/);
              if (columns.length < 4) return null;
              return {
                  name: columns[0],
                  version: columns[1],
                  source: columns[2],
                  binaries: columns[3]
              };
          }).filter(row => row); // Remove null values

          resolve(results);
      });
  });
});