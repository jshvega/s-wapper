import Link from 'next/link'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
