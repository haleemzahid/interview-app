import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CategoryProgress, Answer } from '../../types'
import { QuestionListItem } from './QuestionListItem'

interface CategoryItemProps {
  category: CategoryProgress
  answers: Record<string, Answer>
  currentQuestionIndex: number
  allVisibleQuestions: { id: string }[]
  onQuestionClick: (index: number) => void
}

export function CategoryItem({
  category,
  answers,
  currentQuestionIndex,
  allVisibleQuestions,
  onQuestionClick,
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(category.isCurrentCategory)

  // Auto-expand when this becomes the current category
  useEffect(() => {
    if (category.isCurrentCategory) {
      setIsExpanded(true)
    }
  }, [category.isCurrentCategory])

  const progressPercentage =
    category.totalQuestions > 0
      ? Math.round(
          (category.answeredQuestions / category.totalQuestions) * 100
        )
      : 0

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const getGlobalQuestionIndex = (questionId: string): number => {
    return allVisibleQuestions.findIndex((q) => q.id === questionId)
  }

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Category Header */}
      <button
        onClick={handleToggle}
        className={clsx(
          'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
          category.isCurrentCategory
            ? 'bg-teal-50'
            : 'bg-gray-50 hover:bg-gray-100'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className={clsx(
                'text-sm font-medium truncate',
                category.isCurrentCategory ? 'text-teal-700' : 'text-gray-700'
              )}
            >
              {category.title}
            </span>
            <span className="ml-2 text-xs text-gray-500 flex-shrink-0">
              {category.answeredQuestions}/{category.totalQuestions}
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-300',
                category.isCurrentCategory ? 'bg-teal-500' : 'bg-gray-400'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </button>

      {/* Question List */}
      {isExpanded && category.visibleQuestions.length > 0 && (
        <div className="bg-white py-1">
          {category.visibleQuestions.map((question) => {
            const globalIndex = getGlobalQuestionIndex(question.id)
            const isCurrent = globalIndex === currentQuestionIndex

            return (
              <QuestionListItem
                key={question.id}
                question={question}
                answer={answers[question.id]}
                isCurrent={isCurrent}
                onClick={() => onQuestionClick(globalIndex)}
              />
            )
          })}
        </div>
      )}

      {/* Empty state for categories with no visible questions */}
      {isExpanded && category.visibleQuestions.length === 0 && (
        <div className="bg-white px-3 py-2 text-xs text-gray-400 italic">
          Keine sichtbaren Fragen
        </div>
      )}
    </div>
  )
}
