import { useState } from 'react'
import { useInterviewMachine } from '../machines'
import type { PatientInfo } from '../types'
import { User, Calendar, FileText, Play } from 'lucide-react'

export function PatientInfoForm() {
  const { startSession, config } = useInterviewMachine()

  const [formData, setFormData] = useState<PatientInfo>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof PatientInfo, string>>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof PatientInfo]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PatientInfo, string>> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      startSession(formData)
    }
  }

  // Count total questions
  const totalQuestions = config?.kategorien.reduce(
    (sum, kat) => sum + kat.fragen.length,
    0
  ) ?? 0

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            Neues Interview starten
          </h2>
          {config && (
            <p className="mt-2 text-gray-500">
              {config.kategorien.length} Kategorien, {totalQuestions} Fragen
            </p>
          )}
          <p className="mt-1 text-sm text-gray-400">
            Bitte geben Sie die Patientendaten ein, um zu beginnen
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Vorname <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.firstName ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Vorname"
                  autoFocus
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Nachname <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.lastName ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Nachname"
                />
              </div>
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Date of Birth & Gender Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dateOfBirth"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Geburtsdatum
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="gender"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Geschlecht
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Auswählen...</option>
                <option value="männlich">Männlich</option>
                <option value="weiblich">Weiblich</option>
                <option value="divers">Divers</option>
                <option value="keine_angabe">Keine Angabe</option>
              </select>
            </div>
          </div>

          {/* Initial Notes */}
          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Erste Notizen
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Relevante Notizen vor Beginn des Interviews..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <Play className="h-5 w-5" />
            Interview starten
          </button>
        </form>

        {/* Session Recovery Notice */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Vorherige Sitzungen werden automatisch gespeichert und können wiederhergestellt werden
        </div>
      </div>
    </div>
  )
}
