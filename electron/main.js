// electron/main.js

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import dgram from 'dgram';
import { Server, Client } from 'node-osc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration constants ---
const DISCOVERY_PORT = 2222;
const DISCOVERY_TIMEOUT = 2000;

// Discover the Wing device at the given IP
function discoverWing(wingIP) {
  return new Promise((resolve, reject) => {
    const sock = dgram.createSocket('udp4');
    const timer = setTimeout(() => {
      sock.close();
      reject(new Error('Discovery timed out'));
    }, DISCOVERY_TIMEOUT);

    sock.once('message', buf => {
      clearTimeout(timer);
      sock.close();
      const parts = buf.toString().split(',');
      if (parts[0] === 'WING') resolve();
      else reject(new Error('Bad response: ' + buf.toString()));
    });

    sock.on('error', err => {
      clearTimeout(timer);
      sock.close();
      reject(err);
    });

    sock.send(Buffer.from('WING?'), 0, 5, DISCOVERY_PORT, wingIP);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });


  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --------------------------------------------------
// IPC handler: run Wing→LiveTrax sync inline in main
// --------------------------------------------------
ipcMain.on('transfer-names', (event, { wingIP, liveTraxIP, sourceGroup }) => {
  event.sender.send('log', `→ Starting transfer: WING=${wingIP}, LiveTrax=${liveTraxIP}, Group=${sourceGroup}`);

  (async () => {
    // ─── Constants ──────────────────────────────────────────────────────────────
    const LOCAL_PORT = 8000;
    const WING_OSC_PORT = 2223;
    const LIVE_TRAX_PORT = 3819;
    const SPECIAL_GROUPS = new Set(['MTX', 'BUS', 'MAIN', 'MON', 'SEND']);
    const CHANNEL_COUNT = { USB: 48, MOD: 64, CRD: 64 }[sourceGroup] || 48;
    const prefix = `/%${LOCAL_PORT}`;

    // ─── Hard-coded names for MON & SEND ───────────────────────────────────────
    const HARDCODED_NAMES = {
      MON: { 1: 'HP L', 2: 'HP R', 3: 'Speaker L', 4: 'Speaker R' },
      SEND: (inNum) => `FX Send ${Math.ceil(inNum / 2)}`
    };

    // ─── State ──────────────────────────────────────────────────────────────────
    const channelInfo = new Map();  // outIdx → { grp, in, name, mode, requested, assigned }
    let oscClient, traxClient, server;
    let finished = false;

    try {
      // [1] Discover Wing
      event.sender.send('log', '🔍 Discovering Wing…');
      await new Promise((resolve, reject) => {
        const sock = dgram.createSocket('udp4');
        const timer = setTimeout(() => { sock.close(); reject(new Error('Discovery timed out')); }, 2000);

        sock.once('message', buf => {
          clearTimeout(timer);
          sock.close();
          const [id] = buf.toString().split(',');
          id === 'WING' ? resolve() : reject(new Error('Bad response: ' + buf.toString()));
        });
        sock.on('error', err => { clearTimeout(timer); sock.close(); reject(err); });
        sock.send(Buffer.from('WING?'), 0, 5, 2222, wingIP);
      });
      event.sender.send('log', '🟢 Wing discovered');

      // [2] OSC clients
      oscClient = new Client(wingIP, WING_OSC_PORT);
      traxClient = new Client(liveTraxIP, LIVE_TRAX_PORT);

      // [3] tryAssign helper
      function tryAssign(outIdx) {
        const info = channelInfo.get(outIdx);
        if (!info || info.assigned || info.grp === 'OFF') return;

        // MON
        if (info.grp === 'MON' && info.in && HARDCODED_NAMES.MON[info.in]) {
          info.name = HARDCODED_NAMES.MON[info.in];
          info.assigned = true;
          //event.sender.send('log',`🎧 ${sourceGroup}/${outIdx} → MON/${info.in} → "${info.name}" (Hardcoded)`);
          return;
        }
        // SEND
        if (info.grp === 'SEND' && info.in) {
          info.name = HARDCODED_NAMES.SEND(info.in);
          info.assigned = true;
          //event.sender.send('log',`📤 ${sourceGroup}/${outIdx} → SEND/${info.in} → "${info.name}" (Hardcoded)`);
          return;
        }
        // Standard
        const isSpec = SPECIAL_GROUPS.has(info.grp);
        const ready = isSpec ? info.name != null : (info.name != null && info.mode === 'ST');
        if (!ready) return;

        const suffix = (info.in % 2 === 1 ? ' L' : ' R');
        info.name = info.name + suffix;
        info.assigned = true;
        //event.sender.send('log',`🏷 ${sourceGroup}/${outIdx} → ${info.grp}/${info.in} → "${info.name}"`);
      }

      // [4] OSC Server
      server = new Server(LOCAL_PORT, '0.0.0.0', () => {
        event.sender.send('log', `🟢 OSC server ready on port ${LOCAL_PORT}`);
        oscClient.send(`${prefix}/xremote`, () => {
          event.sender.send('log', '→ Sent xremote');
          // prime channelInfo and query each out
          for (let i = 1; i <= CHANNEL_COUNT; i++) {
            channelInfo.set(i, { grp: null, in: null, name: null, mode: null, requested: false, assigned: false });
            oscClient.send(`${prefix}/io/out/${sourceGroup}/${i}/grp`);
            oscClient.send(`${prefix}/io/out/${sourceGroup}/${i}/in`);
          }
        });
      });

      // [5] Message handling
      server.on('message', (msg) => {
        const [addr, ...args] = msg;
        const parts = addr.split('/');
        // --- out/.../grp or in
        if (parts[1] === 'io' && parts[2] === 'out' && parts[3] === sourceGroup) {
          const outIdx = +parts[4];
          const info = channelInfo.get(outIdx);
          if (parts[5] === 'grp') {
            info.grp = args[0];
            if (info.grp === 'OFF') {
              info.name = 'OFF'; info.assigned = true;
              //event.sender.send('log',`⏩ ${sourceGroup}/${outIdx} is OFF`);
              return;
            }
            if (info.grp === 'MON' || info.grp === 'SEND') {
              info.requested = true;
              //event.sender.send('log', `⏭ ${info.grp} group detected, using hardcoded names`);
            }
          }
          else if (parts[5] === 'in') {
            info.in = +args[0];
          }
          if ((info.grp === 'MON' || info.grp === 'SEND') && info.in != null) {
            tryAssign(outIdx);
            return;
          }
          if (info.grp && info.in != null && !info.requested) {
            info.requested = true;
            if (SPECIAL_GROUPS.has(info.grp)) {
              const busIdx = Math.ceil(info.in / 2);
              oscClient.send(`${prefix}/${info.grp.toLowerCase()}/${busIdx}/name`);
            } else {
              oscClient.send(`${prefix}/io/in/${info.grp}/${info.in}/name`);
              oscClient.send(`${prefix}/io/in/${info.grp}/${info.in}/mode`);
            }
          }
          return;
        }

        // --- name replies ---
        const isRegName = parts[1] === 'io' && parts[2] === 'in' && parts[5] === 'name';
        const isSpec = SPECIAL_GROUPS.has(parts[1]?.toUpperCase()) && parts[3] === 'name';
        if (isRegName || isSpec) {
          const grp = isRegName ? parts[3] : parts[1].toUpperCase();
          const idx = isRegName ? +parts[4] : +parts[2];
          const nm = args[0];
          for (const [i, info] of channelInfo.entries()) {
            if (info.grp !== grp) continue;
            const match = SPECIAL_GROUPS.has(grp)
              ? Math.ceil(info.in / 2) === idx
              : info.in === idx;
            if (match) {
              info.name = nm;
              tryAssign(i);
              if (!SPECIAL_GROUPS.has(grp)) break;
            }
          }
          return;
        }

        // --- mode replies ---
        if (parts[1] === 'io' && parts[2] === 'in' && parts[5] === 'mode') {
          const grp = parts[3], idx = +parts[4], md = args[0].toUpperCase();
          for (const [i, info] of channelInfo.entries()) {
            if (info.grp === grp && info.in === idx) {
              info.mode = md;
              tryAssign(i);
              break;
            }
          }
        }
      });

      // [6] finish() only once
      function finish() {
        if (finished) return;
        finished = true;
        clearInterval(checkInterval);
        clearTimeout(fallbackTimeout);

        //event.sender.send('log','✅ Final Assignments:');
        const strips = [];
        for (let i = 1; i <= CHANNEL_COUNT; i++) {
          const info = channelInfo.get(i);
          let nm = info.name || null;
          // ensure special groups have suffix
          if (nm && SPECIAL_GROUPS.has(info.grp)) {
            const suf = info.in % 2 === 1 ? ' L' : ' R';
            if (!nm.endsWith(suf)) nm += suf;
          }
          //event.sender.send('log', `• ${sourceGroup}/${i}: ${nm||'NULL'}`);
          if (nm) strips.push({ index: i, name: nm });
        }

        // send to LiveTrax
        let sent = 0;
        strips.forEach(({ index, name }) => {
          traxClient.send('/strip/name', index, name, () => {
            if (name === 'OFF') {
              //event.sender.send('log', `→ LiveTrax strip ${index} not renamed (OFF)`);
              sent++;
            } else {
              sent++;
              event.sender.send('log', `→ LiveTrax strip ${index} renamed "${name}"`);
            }


            if (sent === strips.length) {
              event.sender.send('log', '🎉 All strips renamed');
              server.close();
              oscClient.close();
              traxClient.close();
            }
          });
        });
      }

      // [7] name-based polling
      const checkInterval = setInterval(() => {
        const namedCount = [...channelInfo.values()].filter(info => info.name != null).length;
        if (namedCount === CHANNEL_COUNT) finish();
      }, 100);

      // [8] 2 s fallback
      const fallbackTimeout = setTimeout(() => {
        if (!finished) {
          const namedCount = [...channelInfo.values()].filter(info => info.name != null).length;
          event.sender.send('log', `⏱ Timeout reached (${namedCount}/${CHANNEL_COUNT} names)`);
          finish();
        }
      }, 2000);

    } catch (err) {
      event.sender.send('log', `❌ Error: ${err.message}`);
      if (server) server.close();
      if (oscClient) oscClient.close();
      if (traxClient) traxClient.close();
    }
  })();
});

ipcMain.on('start-recording', (event, { liveTraxIP }) => {
  const traxClient = new Client(liveTraxIP, 3819);
  event.sender.send('log', `→ Starting recording... LiveTrax=${liveTraxIP}`);

  traxClient.send('/access_action', 'Transport/crash-record', () => {
    traxClient.close();
  });
});

ipcMain.on('stop-recording', (event, { liveTraxIP }) => {
  const traxClient = new Client(liveTraxIP, 3819);
  event.sender.send('log', `→ Stopping recording... LiveTrax=${liveTraxIP}`);

  traxClient.send('/transport_stop', () => {
    traxClient.close();
  });
}); 