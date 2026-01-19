import { useInterviewMachine } from '../../machines'
import { CategoryItem } from './CategoryItem'

export function CategoryNavigation() {
  const { categoryProgress, session, questions, goToQuestion, progress } =
    useInterviewMachine()

  if (!session || categoryProgress.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col border-t border-gray-200">
      {/* Header */}
      <div className="px-3 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Kategorien
          </span>
          <span className="text-xs text-gray-500">
            {progress.answeredCount} / {progress.total}
          </span>
        </div>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto max-h-64">
        {categoryProgress.map((category) => (
          <CategoryItem
            key={category.title}
            category={category}
            answers={session.answers}
            currentQuestionIndex={session.currentQuestionIndex}
            allVisibleQuestions={questions}
            onQuestionClick={goToQuestion}
          />
        ))}
      </div>
    </div>
  )
}
