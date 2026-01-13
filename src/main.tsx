import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import './index.css'
import { initDatabase } from './core/database/client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

const enableDevtools = import.meta.env.VITE_ENABLE_DEVTOOLS === 'true'

async function startApp() {
  try {
    await initDatabase()
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </React.StrictMode>
  )
}

void startApp()
