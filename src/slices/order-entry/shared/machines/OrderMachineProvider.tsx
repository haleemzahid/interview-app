// Order Machine Provider - React context for XState machine

import { createContext, useContext, type ReactNode } from 'react'
import { useMachine, useSelector } from '@xstate/react'
import { orderMachine, type OrderContext } from './orderMachine'
import type { ActorRefFrom } from 'xstate'

// === Types ===

type OrderActorRef = ActorRefFrom<typeof orderMachine>

// === Actor Context (for useSelector) ===

const OrderActorContext = createContext<OrderActorRef | null>(null)

export function useOrderActorRef(): OrderActorRef {
  const actorRef = useContext(OrderActorContext)
  if (!actorRef) {
    throw new Error('useOrderActorRef must be used within OrderMachineProvider')
  }
  return actorRef
}

// Generic selector hook for optimized subscriptions
export function useOrderSelector<T>(
  selector: (state: { context: OrderContext; value: unknown }) => T,
  compare?: (a: T, b: T) => boolean
): T {
  const actorRef = useOrderActorRef()
  return useSelector(actorRef, selector, compare)
}

// === Provider ===

interface OrderMachineProviderProps {
  children: ReactNode
}

export function OrderMachineProvider({ children }: OrderMachineProviderProps) {
  const [_state, _send, actorRef] = useMachine(orderMachine)

  return (
    <OrderActorContext.Provider value={actorRef}>
      {children}
    </OrderActorContext.Provider>
  )
}
