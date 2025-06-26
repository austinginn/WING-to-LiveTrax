<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          WING to LiveTrax Sync
        </h1>
        <div class="info-button" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div v-if="showTooltip" class="tooltip">
            <h3>Live Trax Setup Guide</h3>
            <ol class="setup-steps">
              <li>Add corresponding # of mono tracks to match selected output group</li>
              <li>Open LiveTrax Preferences</li>
              <li>Go to the "OSC Control" section</li>
              <li>Enable OSC input</li>
              <li>Ensure it's listening on port <strong>3819</strong></li>
              <li>Allow connections from this machine's IP if prompted</li>
            </ol>
          </div>
        </div>
      </div>
    </header>

    <div class="content-wrapper">
      <div class="control-panel">
        <div class="control-content">
          <div class="input-group">
            <label class="input-label">
              <span>WING IP Address</span>
              <input v-model="wingIP" type="text" placeholder="e.g., 192.168.1.100" class="text-input" />
            </label>
          </div>

          <div class="input-group">
            <label class="input-label">
              <span>Live Trax IP Address</span>
              <input v-model="liveTraxIP" type="text" placeholder="127.0.0.1" class="text-input" />
            </label>
          </div>

          <div class="input-group">
            <label class="input-label">
              <span>Record Output Group</span>
              <select v-model="sourceGroup" class="select-input">
                <option v-for="grp in groups" :key="grp" :value="grp">{{ grp }}</option>
              </select>
            </label>
          </div>

          <!-- Transfer Names Button (Moved Up) -->
          <div class="button-group">
            <button @click="transferNames" class="action-button transfer-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 1l4 4-4 4"></path>
                <path d="M3 11V9a4 4 0 014-4h14"></path>
                <path d="M7 23l-4-4 4-4"></path>
                <path d="M21 13v2a4 4 0 01-4 4H3"></path>
              </svg>
              Transfer Names
            </button>
          </div>

          <!-- Scheduled Recording Section -->
          <div class="input-group">
            <label class="input-label">
              <span>Scheduled Recording</span>
              <div class="time-input-group">
                <input v-model="scheduledTime" type="time" class="time-input" :min="currentTime"
                  @change="validateScheduledTime">
                <button @click="scheduleRecording" class="action-button schedule-button"
                  :disabled="!scheduledTimeValid">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Schedule
                </button>
              </div>
            </label>
            <div v-if="scheduledRecording" class="scheduled-info">
              <span>Recording scheduled for {{ scheduledTime }} ({{ timeRemaining }})</span>
              <button @click="cancelScheduledRecording" class="cancel-schedule-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Record/Stop Buttons -->
          <div class="button-group">
            <div class="record-buttons">
              <button @click="startRecording" class="action-button record-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Record
              </button>
              <button @click="stopRecording" class="action-button stop-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="6" y="6" width="12" height="12"></rect>
                </svg>
                Stop
              </button>
            </div>
          </div>
        </div>
        <footer class="floating-footer">
          Created by <a href="mailto:austinleeginn@gmail.com">Austin Ginn</a><br>
          <a href='https://ko-fi.com/M4M81985YD' target='_blank'><img height='36' style='border:0px;height:36px;'
              src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
              <p>v {{version}} </p>
        </footer>
      </div>

      <div class="log-panel">
        <div class="log-header">
          <h2>Activity Log</h2>
          <div class="log-actions">
            <button @click="copyLogs" class="copy-button" title="Copy logs to clipboard">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
              </svg>
              Copy
            </button>
            <button @click="clearLog" class="clear-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
              Clear
            </button>
          </div>
        </div>
        <div class="log-content" ref="logBox">
          <div v-for="(line, index) in log" :key="index" class="log-line">
            <span class="log-timestamp">{{ line.match(/\[(.*?)\]/)?.[1] || '' }}</span>
            <span class="log-message">{{ line.replace(/\[.*?\]/, '').trim() }}</span>
          </div>
          <div ref="logEnd"></div>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

const wingIP = ref('')
const liveTraxIP = ref('127.0.0.1')
const sourceGroup = ref('USB')
const log = ref([])
const logEnd = ref(null)
const showTooltip = ref(false)
const scheduledTime = ref('')
const scheduledRecording = ref(null)
const currentTime = ref('')
const scheduledTimeValid = ref(false)
const checkInterval = ref(null)
const version = ref(import.meta.env.VITE_APP_VERSION);

const groups = ['USB', 'CRD', 'MOD']

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString()
  log.value.push(`[${timestamp}] ${message}`)
}

function clearLog() {
  log.value = []
}

function copyLogs() {
  const logText = log.value.join('\n')
  navigator.clipboard.writeText(logText)
    .then(() => {
      addLog('Logs copied to clipboard')
    })
    .catch(err => {
      addLog('Failed to copy logs: ' + err.message)
      // Fallback for browsers without Clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = logText
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        addLog('Logs copied to clipboard (fallback method)')
      } catch (fallbackErr) {
        addLog('Failed to copy logs: ' + fallbackErr.message)
      }
      document.body.removeChild(textarea)
    })
}

function updateCurrentTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`

  // Check if scheduled recording should start
  if (scheduledRecording.value && scheduledTime.value === currentTime.value) {
    startRecording()
    scheduledRecording.value = null
    scheduledTime.value = ''
  }
}

function validateScheduledTime() {
  if (!scheduledTime.value) {
    scheduledTimeValid.value = false
    return
  }

  const [scheduledHours, scheduledMinutes] = scheduledTime.value.split(':').map(Number)
  const [currentHours, currentMinutes] = currentTime.value.split(':').map(Number)

  scheduledTimeValid.value = (scheduledHours > currentHours) ||
    (scheduledHours === currentHours && scheduledMinutes > currentMinutes)
}

function scheduleRecording() {
  if (!scheduledTimeValid.value) return

  // Cancel any existing scheduled recording
  if (scheduledRecording.value) {
    addLog(`Cancelled previous scheduled recording (was ${scheduledRecording.value.time})`)
    stopCheckInterval()
  }

  scheduledRecording.value = {
    time: scheduledTime.value,
    timestamp: Date.now()
  }
  addLog(`Recording scheduled for ${scheduledTime.value}`)

  // Start checking every second when close to scheduled time
  const [scheduledHours, scheduledMinutes] = scheduledTime.value.split(':').map(Number)
  const now = new Date()
  const targetTime = new Date()
  targetTime.setHours(scheduledHours)
  targetTime.setMinutes(scheduledMinutes)
  targetTime.setSeconds(0)

  const diffMs = targetTime - now
  if (diffMs < 5 * 60 * 1000) { // If within 5 minutes
    startCheckInterval()
  }
}

function cancelScheduledRecording() {
  addLog(`Cancelled scheduled recording for ${scheduledTime.value}`)
  scheduledRecording.value = null
  scheduledTime.value = ''
  stopCheckInterval()
}

function startCheckInterval() {
  stopCheckInterval()
  checkInterval.value = setInterval(() => {
    updateCurrentTime()
  }, 1000)
}

function stopCheckInterval() {
  if (checkInterval.value) {
    clearInterval(checkInterval.value)
    checkInterval.value = null
  }
}

const timeRemaining = computed(() => {
  if (!scheduledRecording.value) return ''

  const now = new Date()
  const [scheduledHours, scheduledMinutes] = scheduledTime.value.split(':').map(Number)

  const targetTime = new Date()
  targetTime.setHours(scheduledHours)
  targetTime.setMinutes(scheduledMinutes)
  targetTime.setSeconds(0)

  const diffMs = targetTime - now
  const diffMins = Math.round(diffMs / 60000)

  if (diffMins <= 0) {
    return 'now'
  } else if (diffMins < 60) {
    return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`
  } else {
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `in ${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins !== 1 ? 's' : ''}` : ''}`
  }
})

// auto-scroll
watch(log, async () => {
  await nextTick()
  logEnd.value?.scrollIntoView({ behavior: 'smooth' })
})

onMounted(() => {
  updateCurrentTime()
  // Check every minute normally
  const timer = setInterval(updateCurrentTime, 60000)
  onBeforeUnmount(() => {
    clearInterval(timer)
    stopCheckInterval()
  })

  // subscribe to back-end logs
  window.electronAPI.on('log', msg => {
    addLog(msg)
  })
})

function transferNames() {
  addLog(`Transferring channel names from ${wingIP.value} to ${liveTraxIP.value} (Group: ${sourceGroup.value})`)
  window.electronAPI.send('transfer-names', {
    wingIP: wingIP.value,
    liveTraxIP: liveTraxIP.value,
    sourceGroup: sourceGroup.value
  })
}

function startRecording() {
  addLog(`Starting recording on Live Trax at ${liveTraxIP.value}`)
  window.electronAPI.send('start-recording', {
    liveTraxIP: liveTraxIP.value
  })
}

function stopRecording() {
  addLog(`Stopping recording on Live Trax at ${liveTraxIP.value}`)
  window.electronAPI.send('stop-recording', {
    liveTraxIP: liveTraxIP.value
  })
}
</script>

<style>
:root {
  --primary: #4361ee;
  --primary-dark: #3a56d4;
  --danger: #ef233c;
  --danger-dark: #d90429;
  --success: #4cc9f0;
  --success-dark: #4895ef;
  --background: #0f172a;
  --surface: #1e293b;
  --surface-light: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border: #334155;
  --border-radius: 8px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  overflow: hidden;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--background);
  color: var(--text-primary);
  line-height: 1.5;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  overflow: hidden;
}

.app-header {
  padding: 1.5rem 1.5rem 0.5rem;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-left: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.logo-icon {
  font-size: 1.75rem;
}

.info-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: var(--surface-light);
  border-radius: 50%;
  cursor: help;
  transition: all 0.2s ease;
}

.info-button:hover {
  background-color: var(--primary);
  transform: scale(1.05);
}

.tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-top: 0.75rem;
  box-shadow: var(--shadow);
  z-index: 10;
  opacity: 0;
  transform: translateY(-5px);
  transition: all 0.2s ease;
  pointer-events: none;
}

.info-button:hover .tooltip {
  opacity: 1;
  transform: translateY(0);
}

.tooltip h3 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.setup-steps {
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.setup-steps li {
  margin-bottom: 0.5rem;
}

.setup-steps li:last-child {
  margin-bottom: 0;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0 1.5rem 1.5rem;
  gap: 1.5rem;
}

.control-panel {
  background-color: var(--surface);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  flex-shrink: 0;
}

.control-content {
  padding: 1.5rem;
}

.input-group {
  margin-bottom: 1.25rem;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.text-input,
.select-input,
.time-input {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--surface-light);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

.text-input:focus,
.select-input:focus,
.time-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
}

.select-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
}

.time-input-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
  width: 100%;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button:active {
  transform: translateY(0);
}

.action-button svg {
  flex-shrink: 0;
}

.transfer-button {
  background-color: var(--primary);
  color: white;
}

.transfer-button:hover {
  background-color: var(--primary-dark);
}

.schedule-button {
  background-color: var(--success-dark);
  color: white;
}

.schedule-button:hover:not(:disabled) {
  background-color: var(--success);
}

.schedule-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.record-buttons {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.record-button {
  flex: 1;
  background-color: var(--danger);
  color: white;
  min-width: 0;
}

.record-button:hover {
  background-color: var(--danger-dark);
}

.stop-button {
  flex: 1;
  background-color: var(--surface-light);
  color: var(--text-primary);
  min-width: 0;
}

.stop-button:hover {
  background-color: var(--border);
}

.scheduled-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(76, 201, 240, 0.1);
  border-radius: 4px;
  font-size: 0.8125rem;
}

.cancel-schedule-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-schedule-button:hover {
  background-color: rgba(239, 35, 60, 0.1);
  color: var(--danger);
}

.log-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  min-height: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--surface-light);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.log-actions {
  display: flex;
  gap: 0.75rem;
}

.copy-button,
.clear-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background-color: rgba(67, 97, 238, 0.1);
  border-color: var(--primary);
  color: var(--primary);
}

.clear-button:hover {
  background-color: rgba(239, 35, 60, 0.1);
  border-color: var(--danger);
  color: var(--danger);
}

.copy-button svg,
.clear-button svg {
  flex-shrink: 0;
}

.log-content {
  flex: 1;
  padding: 1rem 1.5rem;
  overflow-y: auto;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  min-height: 0;
}

.log-line {
  margin-bottom: 0.5rem;
  word-break: break-word;
}

.log-line:last-child {
  margin-bottom: 0;
}

.log-timestamp {
  color: var(--success);
  margin-right: 0.5rem;
}

.log-message {
  color: var(--text-primary);
}

@media (min-width: 768px) {
  .content-wrapper {
    flex-direction: row;
    padding: 0 2rem 2rem;
    gap: 2rem;
  }

  .control-panel {
    width: 360px;
    height: 100%;
  }

  .log-panel {
    flex: 1;
  }
}

.control-content>.button-group:not(:last-child) {
  margin-bottom: 1.25rem;
}

.floating-footer {
  bottom: 0;
  color: #d7d7d7;
  text-align: center;
  padding: 10px 20px;
  font-size: 14px;
  border-top-left-radius: 10px;
  font-weight: Bold;
}

.floating-footer a {
  color: #d7d7d7;
  text-decoration: underline;
}

.floating-footer p {
  color: #d7d7d7;
  font-size: 10px;
}

a:hover {
  text-decoration: none;
  color: #72a4f2;
}
</style>