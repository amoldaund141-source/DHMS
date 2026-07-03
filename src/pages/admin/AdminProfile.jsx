import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
]

export default function AdminProfile() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: '+91 98765 43210' },
  })

  const { register: regPw, handleSubmit: handlePw, watch: watchPw, reset: resetPw, formState: { errors: pwErrors } } = useForm()
  const newPw = watchPw('newPassword')

  const onSaveProfile = async (data) => {
    await new Promise((r) => setTimeout(r, 600))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const onChangePw = async () => {
    await new Promise((r) => setTimeout(r, 600))
    setPwSaved(true)
    resetPw()
    setTimeout(() => setPwSaved(false), 2500)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="max-w-xl space-y-6 pb-6">
      <h2 className="font-display font-semibold text-xl text-ink">{t('profile.title')}</h2>

      {/* Avatar + role badge */}
      <motion.div
        className="card p-6 flex items-center gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span className="font-mono text-2xl font-bold text-primary">{user?.name?.[0]?.toUpperCase() ?? 'U'}</span>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg text-ink">{user?.name ?? 'User'}</h3>
          <p className="font-body text-sm text-body/70">{user?.email}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-semibold capitalize">{user?.role}</span>
        </div>
      </motion.div>

      {/* Edit profile form */}
      <motion.div
        className="card p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('profile.editProfile')}</h3>
        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          <div>
            <label htmlFor="prof-name" className="block font-body text-xs font-medium text-ink mb-1.5">{t('auth.fullName')}</label>
            <input id="prof-name" type="text" className="form-input" {...register('name', { required: true })} />
          </div>
          <div>
            <label htmlFor="prof-email" className="block font-body text-xs font-medium text-ink mb-1.5">{t('auth.email')}</label>
            <input id="prof-email" type="email" className="form-input" {...register('email', { required: true })} />
          </div>
          <div>
            <label htmlFor="prof-phone" className="block font-body text-xs font-medium text-ink mb-1.5">{t('auth.phone')}</label>
            <input id="prof-phone" type="tel" className="form-input" {...register('phone')} />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary">{t('profile.saveChanges')}</button>
            {saved && (
              <motion.span
                className="font-body text-xs text-success flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Saved!
              </motion.span>
            )}
          </div>
        </form>
      </motion.div>

      {/* Change password */}
      <motion.div
        className="card p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('profile.changePassword')}</h3>
        <form onSubmit={handlePw(onChangePw)} className="space-y-4">
          <div>
            <label htmlFor="pw-current" className="block font-body text-xs font-medium text-ink mb-1.5">Current password</label>
            <input id="pw-current" type="password" className="form-input" {...regPw('currentPassword', { required: true })} />
          </div>
          <div>
            <label htmlFor="pw-new" className="block font-body text-xs font-medium text-ink mb-1.5">New password</label>
            <input id="pw-new" type="password" className="form-input" {...regPw('newPassword', { required: true, minLength: 6 })} />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="block font-body text-xs font-medium text-ink mb-1.5">Confirm new password</label>
            <input id="pw-confirm" type="password" className="form-input"
              {...regPw('confirmPassword', { required: true, validate: v => v === newPw || 'Passwords do not match' })}
            />
            {pwErrors.confirmPassword && <p className="text-2xs text-critical mt-1">{pwErrors.confirmPassword.message}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-ghost">{t('profile.changePassword')}</button>
            {pwSaved && (
              <motion.span className="font-body text-xs text-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Password updated!
              </motion.span>
            )}
          </div>
        </form>
      </motion.div>

      {/* Language preference */}
      <motion.div
        className="card p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('profile.language')}</h3>
        <div className="flex gap-3">
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.code}
              onClick={() => i18n.changeLanguage(l.code)}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-body font-medium transition-all ${
                i18n.language === l.code
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'border-border text-body hover:border-primary/40'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-lg border border-critical/30 text-critical text-sm font-body font-medium hover:bg-critical-tint transition-colors"
        >
          {t('auth.logout')}
        </button>
      </motion.div>
    </div>
  )
}
