import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Auth0ProviderWithNavigate from './Auth0ProviderWithNavigate'
import './index.css'
import App from './App.jsx'
import { warmUp } from './api/http'

// Wake a sleeping backend as early as possible
warmUp(import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <App />
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>,
)
