import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AudioProvider } from './context/AudioContext'
import { AuthProvider } from './context/AuthContext' 
import { MixerProvider } from './context/MixerContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AudioProvider>
          <MixerProvider>
            <App />
          </MixerProvider>
        </AudioProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)