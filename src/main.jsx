import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { LocaleProvider } from './locale.js'

createRoot(document.getElementById('root')).render(
  <LocaleProvider>
    <App />
  </LocaleProvider>
)
