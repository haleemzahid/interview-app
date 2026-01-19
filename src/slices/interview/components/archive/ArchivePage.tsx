import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Archive, Search, Filter, ArrowLeft, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { useInterviewMachine } from '../../machines'
import {
  listArchivedInterviews,
  loadArchivedInterview,
  deleteArchivedInterview,
} from '../../services'
import type { ArchivedInterviewMeta } from '../../types'
import { ArchiveListItem } from './ArchiveListItem'
import { ArchiveEmptyState } from './ArchiveEmptyState'

type StatusFilter = 'all' | 'in_progress' | 'paused' | 'completed'

export function ArchivePage() {
  const navigate = useNavigate()
  const { loadFromArchive, session } = useInterviewMachine()

  const [archives, setArchives] = useState<ArchivedInterviewMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const loadArchives = async () => {
    setLoading(true)
    try {
      const data = await listArchivedInterviews()
      setArchives(data)
    } catch (e) {
      console.error('Failed to load archives:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArchives()
  }, [])

  const filteredArchives = archives.filter((archive) => {
    // Status filter
    if (statusFilter !== 'all' && archive.status !== statusFilter) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return archive.patientName.toLowerCase().includes(query)
    }

    return true
  })

  const handleResume = async (archiveId: string) => {
    // Check if there's an active session
    if (session && session.status === 'in_progress') {
      const confirmed = window.confirm(
        'Es gibt ein laufendes Interview. Möchten Sie das archivierte Interview laden? Das aktuelle Interview wird pausiert.'
      )
      if (!confirmed) return
    }

    const archived = await loadArchivedInterview(archiveId)
    if (archived) {
      loadFromArchive(archived)
      navigate({ to: '/' })
    }
  }

  const handleView = async (archiveId: string) => {
    const archived = await loadArchivedInterview(archiveId)
    if (archived) {
      loadFromArchive(archived)
      navigate({ to: '/' })
    }
  }

  const handleDelete = async (archiveId: string) => {
    const confirmed = window.confirm(
      'Möchten Sie dieses archivierte Interview wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
    )
    if (!confirmed) return

    const success = await deleteArchivedInterview(archiveId)
    if (success) {
      setArchives((prev) => prev.filter((a) => a.id !== archiveId))
    }
  }

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'in_progress', label: 'In Bearbeitung' },
    { value: 'paused', label: 'Pausiert' },
    { value: 'completed', label: 'Abgeschlossen' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: '/' })}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Zurück</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Archive className="h-6 w-6 text-teal-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Interview-Archiv
                </h1>
              </div>
            </div>
            <button
              onClick={loadArchives}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={clsx('h-4 w-4', loading && 'animate-spin')}
              />
              Aktualisieren
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Patient suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex rounded-lg border border-gray-300 bg-white p-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={clsx(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    statusFilter === option.value
                      ? 'bg-teal-100 text-teal-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Archive List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredArchives.length === 0 ? (
          archives.length === 0 ? (
            <ArchiveEmptyState />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500">
                Keine Interviews gefunden für die aktuellen Filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="mt-2 text-sm text-teal-600 hover:text-teal-700"
              >
                Filter zurücksetzen
              </button>
            </div>
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArchives.map((archive) => (
              <ArchiveListItem
                key={archive.id}
                archive={archive}
                onResume={() => handleResume(archive.id)}
                onView={() => handleView(archive.id)}
                onDelete={() => handleDelete(archive.id)}
              />
            ))}
          </div>
        )}

        {/* Count */}
        {!loading && filteredArchives.length > 0 && (
          <p className="mt-6 text-center text-sm text-gray-500">
            {filteredArchives.length}{' '}
            {filteredArchives.length === 1 ? 'Interview' : 'Interviews'}{' '}
            gefunden
          </p>
        )}
      </main>
    </div>
  )
}
