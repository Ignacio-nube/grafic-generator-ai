import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from '@/components/ui/provider'
import { AuthProvider } from './contexts/AuthContext'
import './i18n/config'
import './index.css'
import App from './App.tsx'
import SharedChartPage from './pages/shared/SharedChartPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/chart/:shareId" element={<SharedChartPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  </StrictMode>,
)
