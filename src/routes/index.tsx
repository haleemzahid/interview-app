import { createFileRoute } from '@tanstack/react-router'
import { InterviewMachineProvider, InterviewPage } from '@/slices/interview'

function InterviewRoute() {
  return (
    <InterviewMachineProvider>
      <InterviewPage />
    </InterviewMachineProvider>
  )
}

export const Route = createFileRoute('/')({
  component: InterviewRoute,
})
