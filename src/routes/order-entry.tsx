import { createFileRoute } from '@tanstack/react-router'
import { OrderMachineProvider } from '@/slices/order-entry/shared/machines'
import { OrderEntryPage } from '@/slices/order-entry/OrderEntryPage'

function OrderEntryRoute() {
  return (
    <OrderMachineProvider>
      <OrderEntryPage />
    </OrderMachineProvider>
  )
}

export const Route = createFileRoute('/order-entry')({
  component: OrderEntryRoute,
})
