import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './ThemeProvider'
import { router } from './router'
import { startClock } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'

export function App() {
  useEffect(() => {
    startClock()
    void useCrmStore.getState().load()
  }, [])

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
