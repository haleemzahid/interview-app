import {
  createRootRoute,
  Outlet,
  useLocation,
  Navigate,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Layout from '../core/ui/Layout'
import { useIsAuthenticated } from '../slices/auth'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const enableDevtools = import.meta.env.VITE_ENABLE_DEVTOOLS === 'true'
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  const isLoginRoute = location.pathname === '/login'

  // Redirect unauthenticated users to login (except on login page)
  if (!isAuthenticated && !isLoginRoute) {
    return <Navigate to="/login" />
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && isLoginRoute) {
    return <Navigate to="/" />
  }

  // Login page: render without layout
  if (isLoginRoute) {
    return (
      <>
        <Outlet />
        {enableDevtools && <TanStackRouterDevtools />}
      </>
    )
  }

  // Authenticated routes: render with layout
  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      {enableDevtools && <TanStackRouterDevtools />}
    </>
  )
}
