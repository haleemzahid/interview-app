import { FolderOpen } from 'lucide-react'

export function ArchiveEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-gray-100 p-4">
        <FolderOpen className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        Keine archivierten Interviews
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Abgeschlossene oder pausierte Interviews werden hier automatisch
        gespeichert. Starten Sie ein neues Interview, um loszulegen.
      </p>
    </div>
  )
}
