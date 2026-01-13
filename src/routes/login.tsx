import { createFileRoute } from '@tanstack/react-router'
import LoginForm from '../slices/auth/login/LoginForm'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return <LoginForm />
}
