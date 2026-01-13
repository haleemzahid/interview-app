import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Delete, X } from 'lucide-react'
import { useLogin } from './useLogin'

export default function LoginForm() {
  const [showNumpad, setShowNumpad] = useState(true)
  const loginMutation = useLogin()

  const form = useForm({
    defaultValues: {
      pin: '',
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value.pin)
    },
  })

  // Auto-submit when 4 digits entered
  const handlePinChange = (newPin: string) => {
    // Only allow numeric input
    const numericPin = newPin.replace(/\D/g, '').slice(0, 4)
    form.setFieldValue('pin', numericPin)

    if (numericPin.length === 4 && !loginMutation.isPending) {
      // Small delay to show the 4th digit before submitting
      setTimeout(() => {
        void form.handleSubmit()
      }, 100)
    }
  }

  const handleNumpadClick = (value: string) => {
    const currentPin = form.getFieldValue('pin')

    if (value === 'clear') {
      form.setFieldValue('pin', '')
    } else if (value === 'backspace') {
      form.setFieldValue('pin', currentPin.slice(0, -1))
    } else if (currentPin.length < 4) {
      handlePinChange(currentPin + value)
    }
  }

  const numpadKeys = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'clear',
    '0',
    'backspace',
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-base-content/60 mt-2">Login to your account</p>
          </div>

          {/* Error Message */}
          {loginMutation.isError && (
            <div className="alert alert-error mb-4">
              <span>{loginMutation.error?.message}</span>
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
          >
            {/* PIN Input */}
            <form.Field name="pin">
              {(field) => (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">
                    Enter PIN
                  </legend>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className="input input-lg w-full text-center tracking-[0.5em] font-mono text-2xl"
                    value={field.state.value}
                    onChange={(e) => handlePinChange(e.target.value)}
                    placeholder="••••"
                    autoFocus
                    disabled={loginMutation.isPending}
                  />
                </fieldset>
              )}
            </form.Field>

            {/* Loading Indicator */}
            {loginMutation.isPending && (
              <div className="flex justify-center mt-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}
          </form>

          {/* Toggle Numpad Button */}
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-4"
            onClick={() => setShowNumpad(!showNumpad)}
          >
            {showNumpad ? 'Hide Keyboard' : 'Show Keyboard'}
          </button>

          {/* On-Screen Numpad */}
          {showNumpad && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {numpadKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`btn btn-lg ${
                    key === 'clear' || key === 'backspace'
                      ? 'btn-ghost'
                      : 'btn-neutral'
                  }`}
                  onClick={() => handleNumpadClick(key)}
                  disabled={loginMutation.isPending}
                >
                  {key === 'clear' ? (
                    <X className="w-5 h-5" />
                  ) : key === 'backspace' ? (
                    <Delete className="w-5 h-5" />
                  ) : (
                    key
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
