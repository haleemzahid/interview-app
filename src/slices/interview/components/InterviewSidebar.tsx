import { useInterviewMachine } from '../machines'
import type { NavigationTab } from '../types'
import {
  ClipboardList,
  FileText,
  StickyNote,
  FileDown,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'

interface InterviewSidebarProps {
  activeTab: NavigationTab
  onTabChange: (tab: NavigationTab) => void
}

const navItems: Array<{
  id: NavigationTab
  label: string
  icon: React.ElementType
}> = [
  { id: 'interview', label: 'Interview', icon: ClipboardList },
  { id: 'tests', label: 'Tests', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'export', label: 'Export / Report', icon: FileDown },
]

export function InterviewSidebar({
  activeTab,
  onTabChange,
}: InterviewSidebarProps) {
  const { session, progress, questionnaire } = useInterviewMachine()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-lg font-semibold text-gray-800">
          Clinical Interview
        </h1>
        {questionnaire && (
          <p className="mt-1 text-sm text-gray-500">{questionnaire.name}</p>
        )}
      </div>

      {/* Patient Info (if session active) */}
      {session && (
        <div className="border-b border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Patient
          </p>
          <p className="mt-1 font-medium text-gray-700">
            {session.patientInfo.firstName} {session.patientInfo.lastName}
          </p>
          {session.patientInfo.dateOfBirth && (
            <p className="text-sm text-gray-500">
              DOB: {session.patientInfo.dateOfBirth}
            </p>
          )}
        </div>
      )}

      {/* Progress (if session active) */}
      {session && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-700">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {progress.answeredCount} questions answered
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const isDisabled = !session && item.id !== 'interview'

            return (
              <li key={item.id}>
                <button
                  onClick={() => !isDisabled && onTabChange(item.id)}
                  disabled={isDisabled}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : isDisabled
                        ? 'cursor-not-allowed text-gray-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-5 w-5',
                      isActive
                        ? 'text-teal-600'
                        : isDisabled
                          ? 'text-gray-300'
                          : 'text-gray-400'
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-teal-400" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Session Status */}
      {session && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                'h-2 w-2 rounded-full',
                session.status === 'in_progress'
                  ? 'bg-green-500'
                  : session.status === 'paused'
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
              )}
            />
            <span className="text-xs text-gray-500">
              {session.status === 'in_progress'
                ? 'In Progress'
                : session.status === 'paused'
                  ? 'Paused'
                  : 'Completed'}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Last saved:{' '}
            {new Date(session.updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </aside>
  )
}
