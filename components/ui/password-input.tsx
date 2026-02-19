'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Check, X, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordCriteria {
  label: string
  met: boolean
}

function getCriteria(password: string): PasswordCriteria[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number or symbol', met: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password) },
  ]
}

export function checkPasswordStrength(password: string): boolean {
  return getCriteria(password).every((c) => c.met)
}

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showCriteria?: boolean
}

export function PasswordInput({ showCriteria = true, value, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const password = typeof value === 'string' ? value : ''
  const criteria = getCriteria(password)
  const hasInput = password.length > 0

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          value={value}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showCriteria && hasInput && (
        <ul className="space-y-1">
          {criteria.map((c) => (
            <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.met ? 'text-green-600' : 'text-gray-400'}`}>
              {c.met
                ? <Check className="h-3 w-3 shrink-0 text-green-500" />
                : <X className="h-3 w-3 shrink-0 text-gray-300" />}
              {c.label}
            </li>
          ))}
        </ul>
      )}

      {showCriteria && !hasInput && (
        <p className="text-xs text-gray-400">
          Min 8 characters · one uppercase · one number or symbol
        </p>
      )}
    </div>
  )
}
