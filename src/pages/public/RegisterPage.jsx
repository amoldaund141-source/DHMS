import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    setSuccess(true)
    setTimeout(() => navigate('/login'), 2000)
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
          <Link to="/landing" className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-card">
              <span className="font-mono text-sm font-bold text-white">DH</span>
            </div>
            <p className="font-display font-semibold text-ink text-base">{t('app.shortName')}</p>
          </Link>
          <h1 className="font-display font-semibold text-2xl text-ink">{t('auth.registerCta')}</h1>
          <p className="font-body text-sm text-body/70 mt-1">Patient accounts only</p>
        </motion.div>

        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {success ? (
            <motion.div
              className="text-center py-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="w-14 h-14 rounded-full bg-success-tint flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-ink text-lg mb-1">Account created!</h2>
              <p className="font-body text-sm text-body/70">Redirecting to login…</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Full name */}
              <div>
                <label htmlFor="reg-name" className="block font-body text-xs font-medium text-ink mb-1.5">
                  {t('auth.fullName')}
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  className={`form-input ${errors.name ? 'border-critical' : ''}`}
                  placeholder="Ramesh Patil"
                  {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                />
                {errors.name && <p className="text-2xs text-critical mt-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block font-body text-xs font-medium text-ink mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  id="reg-email"
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

              {/* Phone */}
              <div>
                <label htmlFor="reg-phone" className="block font-body text-xs font-medium text-ink mb-1.5">
                  {t('auth.phone')}
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  className={`form-input ${errors.phone ? 'border-critical' : ''}`}
                  placeholder="+91 98765 43210"
                  {...register('phone', { required: 'Phone number is required' })}
                />
                {errors.phone && <p className="text-2xs text-critical mt-1">{errors.phone.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block font-body text-xs font-medium text-ink mb-1.5">
                  {t('auth.password')}
                </label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  className={`form-input ${errors.password ? 'border-critical' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                {errors.password && <p className="text-2xs text-critical mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="reg-confirm" className="block font-body text-xs font-medium text-ink mb-1.5">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  className={`form-input ${errors.confirmPassword ? 'border-critical' : ''}`}
                  placeholder="••••••••"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === password || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <p className="text-2xs text-critical mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                id="register-submit-btn"
                disabled={isLoading}
                className="btn-primary w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account…
                  </span>
                ) : t('auth.register')}
              </button>
            </form>
          )}
        </motion.div>

        <motion.p
          className="text-center font-body text-sm text-body/70 mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('auth.login')}
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
