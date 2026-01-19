import { clsx } from 'clsx'
import { Check, Circle } from 'lucide-react'
import type { FlattenedQuestion, Answer } from '../../types'

interface QuestionListItemProps {
  question: FlattenedQuestion
  answer: Answer | undefined
  isCurrent: boolean
  onClick: () => void
}

export function QuestionListItem({
  question,
  answer,
  isCurrent,
  onClick,
}: QuestionListItemProps) {
  const isAnswered = !!answer
  const truncatedText =
    question.text.length > 50
      ? question.text.substring(0, 50) + '...'
      : question.text

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-start gap-2 rounded px-3 py-2 text-left text-sm transition-colors',
        isCurrent
          ? 'bg-teal-50 text-teal-700 font-medium'
          : 'text-gray-600 hover:bg-gray-50'
      )}
    >
      {isAnswered ? (
        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" />
      )}
      <span className="flex-1 leading-tight">{truncatedText}</span>
    </button>
  )
}
