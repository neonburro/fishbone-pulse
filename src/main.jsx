import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import theme from './theme'
import './index.css'

// After a deploy the old tab still asks for the old chunk files, which are
// gone, and the first lazy route it opens fails. Vite raises this event for
// exactly that. Reload once onto the new build, and never loop.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'fb-reloaded-for-deploy'
  if (sessionStorage.getItem(key) === location.href) return
  sessionStorage.setItem(key, location.href)
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode="light" />
    <ChakraProvider theme={theme} toastOptions={{ defaultOptions: { position: 'bottom-right', variant: 'paper', duration: 3500, isClosable: true } }}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
)
