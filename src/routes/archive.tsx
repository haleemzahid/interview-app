import { createFileRoute } from '@tanstack/react-router'
import { InterviewMachineProvider, ArchivePage } from '@/slices/interview'

function ArchiveRoute() {
  return (
    <InterviewMachineProvider>
      <ArchivePage />
    </InterviewMachineProvider>
  )
}

export const Route = createFileRoute('/archive')({
  component: ArchiveRoute,
})
