import { createFileRoute } from '@tanstack/react-router'
import { BuilderMachineProvider, InterviewBuilderPage } from '@/slices/interview'

function BuilderRoute() {
  return (
    <BuilderMachineProvider>
      <InterviewBuilderPage />
    </BuilderMachineProvider>
  )
}

export const Route = createFileRoute('/builder')({
  component: BuilderRoute,
})
