import { FileText } from 'lucide-react'
import { useInterviewMachine } from '../machines'

export function TestsView() {
  const { session } = useInterviewMachine()

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            Start an interview to access psychological tests
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Psychological Tests
        </h2>
        <p className="text-sm text-gray-500">
          Standardized assessment instruments
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-700">
              Tests Module
            </h3>
            <p className="mt-2 text-gray-500">
              This section can be extended to include standardized psychological
              tests such as:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-500">
              <li>PHQ-9 (Depression Screening)</li>
              <li>GAD-7 (Anxiety Screening)</li>
              <li>AUDIT (Alcohol Use)</li>
              <li>PCL-5 (PTSD Screening)</li>
              <li>Custom assessment tools</li>
            </ul>
            <p className="mt-6 text-sm text-gray-400">
              Tests can be loaded from JSON files, similar to the main interview
              questionnaire.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
