import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import './i18n'
import './index.css'
import App from './App.tsx'
import { requestPersistentStorage } from './data/web'
import { applyTokens } from './theme/cssVars'

applyTokens()
void requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
