'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput, checkPasswordStrength } from '@/components/ui/password-input'
import { register } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!checkPasswordStrength(password)) {
      toast({
        title: 'Weak password',
        description: 'Please meet all password requirements before continuing.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await register(formData)

    setLoading(false)

    if (result?.error) {
      toast({ title: 'Registration failed', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Account created!', description: "Let's set up your schedule." })
      router.push('/onboarding')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} method="post" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Jane Smith"
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@aa.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          required
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
