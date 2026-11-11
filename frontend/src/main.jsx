import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { warmUp } from './api/http'
import { initGeoLang } from './i18n'

// Wake a sleeping backend as early as possible
warmUp(import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1')

initGeoLang()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
