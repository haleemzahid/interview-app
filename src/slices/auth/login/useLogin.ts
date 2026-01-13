import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authenticateEmployee, parseRights } from '../shared/database'
import { useAuth } from '../shared/store'

export function useLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()

  return useMutation({
    mutationFn: async (pin: string) => {
      if (pin?.length !== 4) {
        throw new Error('Filled the password..')
      }

      const result = await authenticateEmployee(pin)
      if (!result) {
        throw new Error('Invalid password!')
      }

      return result
    },
    onSuccess: ({ employee, role }) => {
      const roles = parseRights(role.Rights)
      login(employee, roles)
      navigate({ to: '/' })
    },
  })
}
