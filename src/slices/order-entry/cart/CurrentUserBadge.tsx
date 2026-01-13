// CurrentUserBadge - Displays the logged-in user's name

import { useCurrentUser } from '@/slices/auth'

export function CurrentUserBadge() {
  const currentUser = useCurrentUser()

  return (
    <div className="bg-neutral text-neutral-content flex h-8 items-center rounded px-3 text-sm font-medium">
      {currentUser?.FirstName ?? 'Staff'}
    </div>
  )
}
