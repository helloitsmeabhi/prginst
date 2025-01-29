const { contextBridge, ipcRenderer } = require('electron');
// Expose a secure API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close'),
  maximizeApp: () => ipcRenderer.send('maximize'),
  minimizeApp: () => ipcRenderer.send('minimize'),
  runPowershellCommand: () => ipcRenderer.invoke('run-powershell-command'),
  runCommand: (language) => ipcRenderer.invoke('run-command', language),
  openCommandDialog: () => ipcRenderer.invoke('open-command-dialog'),
  onCommandOutput: (callback) => {
      ipcRenderer.on('command-output', (event, data) => callback(event, data));
  },
  onCommandComplete: (callback) => {
      ipcRenderer.on('command-complete', (event, code) => callback(event, code));
  },
  search: (query) => ipcRenderer.invoke('scoop-search', query),
  install: (packageName) => ipcRenderer.invoke('install-package', packageName),
});
