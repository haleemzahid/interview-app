import { clsx } from 'clsx'
import { Play, Eye, Trash2, Calendar, Clock, CheckCircle2, PauseCircle, Circle } from 'lucide-react'
import type { ArchivedInterviewMeta } from '../../types'

interface ArchiveListItemProps {
  archive: ArchivedInterviewMeta
  onResume: () => void
  onView: () => void
  onDelete: () => void
}

export function ArchiveListItem({
  archive,
  onResume,
  onView,
  onDelete,
}: ArchiveListItemProps) {
  const statusConfig = {
    completed: {
      label: 'Abgeschlossen',
      icon: CheckCircle2,
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      iconColor: 'text-green-500',
    },
    paused: {
      label: 'Pausiert',
      icon: PauseCircle,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-500',
    },
    in_progress: {
      label: 'In Bearbeitung',
      icon: Circle,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
  }

  const status = statusConfig[archive.status]
  const StatusIcon = status.icon

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const progressPercentage =
    archive.questionCount > 0
      ? Math.round((archive.answeredCount / archive.questionCount) * 100)
      : 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {archive.patientName}
          </h3>
          {archive.patientDateOfBirth && (
            <p className="text-sm text-gray-500">
              Geb.: {archive.patientDateOfBirth}
            </p>
          )}
        </div>
        <span
          className={clsx(
            'ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
            status.bgColor,
            status.textColor
          )}
        >
          <StatusIcon className={clsx('h-3.5 w-3.5', status.iconColor)} />
          {status.label}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Fortschritt</span>
          <span className="font-medium text-gray-700">
            {archive.answeredCount} / {archive.questionCount} Fragen
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              archive.status === 'completed'
                ? 'bg-green-500'
                : archive.status === 'paused'
                  ? 'bg-yellow-500'
                  : 'bg-teal-500'
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(archive.startedAt)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Zuletzt: {formatTime(archive.updatedAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {archive.status !== 'completed' ? (
          <button
            onClick={onResume}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <Play className="h-4 w-4" />
            Fortsetzen
          </button>
        ) : (
          <button
            onClick={onView}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <Eye className="h-4 w-4" />
            Ansehen
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600"
          title="Löschen"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
