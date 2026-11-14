import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/nunito'
import './index.css'
import App from './App'
import { initPrefsSync } from './db/prefsSync'
import { initLock } from './store/lock'
import './lib/install'

registerSW({ immediate: true })
void initPrefsSync()
void initLock()
// Ask the browser not to evict IndexedDB under storage pressure (best effort; Safari may ignore).
void navigator.storage?.persist?.().catch(() => false)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
