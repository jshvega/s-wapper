import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Register
        </Link>
      </p>
    </div>
  )
}
