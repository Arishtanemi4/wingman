import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import iconUrl from './icon.png'

const _favicon = document.createElement('link')
_favicon.rel = 'icon'
_favicon.type = 'image/png'
_favicon.href = iconUrl
document.head.appendChild(_favicon)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
