import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import type { Employee } from './types'

// Atoms for auth state (in-memory only)
export const currentUserAtom = atom<Employee | null>(null)
export const userRolesAtom = atom<string[]>([])

// Derived atom for authentication status
export const isAuthenticatedAtom = atom((get) => get(currentUserAtom) !== null)

// Hooks for consuming auth state
export function useCurrentUser() {
  return useAtomValue(currentUserAtom)
}

export function useUserRoles() {
  return useAtomValue(userRolesAtom)
}

export function useIsAuthenticated() {
  return useAtomValue(isAuthenticatedAtom)
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom)
  const [userRoles, setUserRoles] = useAtom(userRolesAtom)
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)

  const login = (employee: Employee, roles: string[]) => {
    setCurrentUser(employee)
    setUserRoles(roles)
  }

  const logout = () => {
    setCurrentUser(null)
    setUserRoles([])
  }

  return {
    currentUser,
    userRoles,
    isAuthenticated,
    login,
    logout,
  }
}

export function useLogout() {
  const setCurrentUser = useSetAtom(currentUserAtom)
  const setUserRoles = useSetAtom(userRolesAtom)

  return () => {
    setCurrentUser(null)
    setUserRoles([])
  }
}
