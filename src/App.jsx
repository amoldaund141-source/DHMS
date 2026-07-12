import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import AppRouter from '@/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import '@/lib/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  1000 * 60 * 2,  // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
