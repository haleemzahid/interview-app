import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const enableDevtools = import.meta.env.VITE_ENABLE_DEVTOOLS === 'true'

  // For the clinical interview app, we render directly without auth
  // The app is local-only and does not require authentication
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      <Outlet />
      {enableDevtools && <TanStackRouterDevtools />}
    </div>
  )
}
