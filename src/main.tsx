import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import store from "./store/store.ts"
import AppWeb3Provider from './wallet/AppWeb3Provider.tsx'

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <AppWeb3Provider>
      <Provider store={store}>
        <App />
      </Provider>
    </AppWeb3Provider>
  </StrictMode>,
)
