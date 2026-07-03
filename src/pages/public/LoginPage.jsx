import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import PulseLine from '@/components/ui/PulseLine'

// Mock credentials map
const MOCK_USERS = {
  'admin@dhms.in':   { password: 'admin123',   role: 'admin',   name: 'Dr. Ananya Rao',    id: 1 },
  'staff@dhms.in':   { password: 'staff123',   role: 'staff',   name: 'Nurse Priya Naik',  id: 2 },
  'patient@dhms.in': { password: 'patient123', role: 'patient', name: 'Suresh Patient',     id: 3 },
}

const ROLE_OPTIONS = [
  {
    value: 'admin', label: 'District Admin',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      </svg>
    ),
    hint: 'admin@dhms.in / admin123',
  },
  {
    value: 'staff', label: 'Hospital Staff',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M9 21V7l3-4 3 4v14M9 12h6M12 9v6" />
      </svg>
    ),
    hint: 'staff@dhms.in / staff123',
  },
  {
    value: 'patient', label: 'Patient',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    hint: 'patient@dhms.in / patient123',
  },
]

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('admin')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: 'admin@dhms.in', password: 'admin123' },
  })

  // Auto-fill credentials when role is selected
  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    const cred = Object.entries(MOCK_USERS).find(([, u]) => u.role === role)
    if (cred) {
      setValue('email', cred[0])
      setValue('password', cred[1].password)
    }
    setAuthError('')
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    setAuthError('')

    try {
      // Try real backend first — SimpleJWT expects { username, password }
      const { authApi } = await import('@/lib/api')
      const res = await authApi.login({ username: data.email, password: data.password })
      login(res.data.token, res.data.user)
      const paths = { admin: '/admin', staff: '/staff', patient: '/patient' }
      navigate(paths[res.data.user.role] ?? '/landing')
    } catch (apiErr) {
      // Backend unreachable — fall back to mock credentials for demo
      if (!apiErr.response) {
        const mockUser = MOCK_USERS[data.email]
        if (mockUser && mockUser.password === data.password) {
          login('mock-jwt-token-' + mockUser.role, {
            id: mockUser.id,
            name: mockUser.name,
            email: data.email,
            role: mockUser.role,
          })
          const paths = { admin: '/admin', staff: '/staff', patient: '/patient' }
          navigate(paths[mockUser.role] ?? '/landing')
          return
        }
      }
      // Show the server error or credential error
      const detail = apiErr.response?.data?.detail
        || apiErr.response?.data?.non_field_errors?.[0]
        || 'Invalid email or password.'
      setAuthError(detail)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-mist via-primary-50 to-mist flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/landing" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-card">
              <span className="font-mono text-sm font-bold text-white">DH</span>
            </div>
            <div className="text-left">
              <p className="font-display font-semibold text-ink text-base leading-tight">{t('app.shortName')}</p>
              <div className="flex items-center gap-1 text-2xs text-body/50">
                <PulseLine mode="indicator" className="text-primary" />
                <span>{t('dashboard.liveData')}</span>
              </div>
            </div>
          </Link>
          <h1 className="font-display font-semibold text-2xl text-ink">{t('auth.loginCta')}</h1>
          <p className="font-body text-sm text-body/70 mt-1">Raigad District Health Portal</p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Role selector */}
          <div className="mb-5">
            <p className="font-body text-xs font-medium text-body mb-2 uppercase tracking-wider">Sign in as</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRoleSelect(r.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-body font-medium transition-all ${
                    selectedRole === r.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-body/70 hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
            <p className="text-2xs text-body/50 font-mono mt-2 text-center">
              {ROLE_OPTIONS.find(r => r.value === selectedRole)?.hint}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="login-email" className="block font-body text-xs font-medium text-ink mb-1.5">
                {t('auth.email')}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={`form-input ${errors.email ? 'border-critical' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="text-2xs text-critical mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="font-body text-xs font-medium text-ink">
                  {t('auth.password')}
                </label>
                <button type="button" className="font-body text-2xs text-primary hover:underline">
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className={`form-input ${errors.password ? 'border-critical' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
              />
              {errors.password && <p className="text-2xs text-critical mt-1">{errors.password.message}</p>}
            </div>

            {/* Auth error */}
            {authError && (
              <motion.div
                className="mb-4 px-3 py-2.5 bg-critical-tint rounded-lg border border-critical/20"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-xs font-body text-critical">{authError}</p>
              </motion.div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : t('auth.login')}
            </button>
          </form>
        </motion.div>

        {/* Register link */}
        <motion.p
          className="text-center font-body text-sm text-body/70 mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('auth.registerCta')}
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
