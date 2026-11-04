const { contextBridge, ipcRenderer } = require('electron');
const methods = ['state', 'login', 'logout', 'scan', 'retry', 'archive', 'pair', 'pairBot', 'copyBotCredential', 'approve', 'unpair', 'reconnect', 'bluetooth', 'printers', 'chooseFolder', 'settings', 'openFolder', 'import', 'asset', 'template', 'preview', 'export', 'printSheet', 'printAwb'];
contextBridge.exposeInMainWorld('station', Object.fromEntries([
  ...methods.map(name => [name, (...args) => ipcRenderer.invoke('station:' + name, ...args)]),
  ['onUpdate', callback => { const listener = (_event, state) => callback(state); ipcRenderer.on('station:update', listener); return () => ipcRenderer.removeListener('station:update', listener); }],
]));
