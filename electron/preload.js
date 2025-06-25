// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    // whitelist channels
    if (channel === 'transfer-names') {
      ipcRenderer.send(channel, data)
    }
    else if (channel === 'start-recording') {
      ipcRenderer.send(channel, data)
    }
    else if (channel === 'stop-recording') {
      ipcRenderer.send(channel, data)
    }
  },
  on: (channel, fn) => {
    if (channel === 'log') {
      ipcRenderer.on(channel, (_, args) => fn(args))
    }
  }
})
