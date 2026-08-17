import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './light-mode.css'
import './tiger-theme.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
