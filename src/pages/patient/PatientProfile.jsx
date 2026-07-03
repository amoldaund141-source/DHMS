import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

const LANG_OPTIONS = [{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी (Hindi)' }]

export default function PatientProfile() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name:  user?.name  ?? '',
      email: user?.email ?? '',
      phone: '+91 99000 00001',
    },
  })

  const onSave = async () => {
    await new Promise((r) => setTimeout(r, 600))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-xl space-y-6 pb-6">
      <h2 className="font-display font-semibold text-xl text-ink">{t('profile.title')}</h2>

      {/* Avatar */}
      <motion.div className="card p-6 flex items-center gap-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
          <span className="font-mono text-2xl font-bold text-success">{user?.name?.[0]?.toUpperCase() ?? 'P'}</span>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg text-ink">{user?.name ?? 'Patient'}</h3>
          <p className="font-body text-sm text-body/70">{user?.email}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-mono font-semibold capitalize">{user?.role ?? 'patient'}</span>
          <p className="font-body text-2xs text-body/50 mt-1">Raigad District Patient</p>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.div className="card p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('profile.editProfile')}</h3>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label htmlFor="pp-name" className="block font-body text-xs font-medium text-ink mb-1.5">{t('auth.fullName')}</label>
            <input id="pp-name" type="text" className="form-input" {...register('name')} />
          </div>
          <div>
            <label htmlFor="pp-email" className="block font-body text-xs font-medium text-ink mb-1.5">{t('auth.email')}</label>
            <input id="pp-email" type="email" className="form-input" {...register('email')} />
          </div>
          <div>
            <label htmlFor="pp-phone" className="block font-body text-xs font-medium text-ink mb-1.5">{t('auth.phone')}</label>
            <input id="pp-phone" type="tel" className="form-input" {...register('phone')} />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary">{t('profile.saveChanges')}</button>
            {saved && (
              <motion.span className="font-body text-xs text-success flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Saved!
              </motion.span>
            )}
          </div>
        </form>
      </motion.div>

      {/* Language */}
      <motion.div className="card p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="font-display font-semibold text-sm text-ink mb-4">{t('profile.language')}</h3>
        <div className="flex gap-3">
          {LANG_OPTIONS.map((l) => (
            <button key={l.code} onClick={() => i18n.changeLanguage(l.code)}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-body font-medium transition-all ${i18n.language === l.code ? 'bg-primary text-white border-primary shadow-sm' : 'border-border text-body hover:border-primary/40'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </motion.div>

      <button onClick={() => { logout(); navigate('/login') }}
        className="w-full py-2.5 rounded-lg border border-critical/30 text-critical text-sm font-body font-medium hover:bg-critical-tint transition-colors">
        {t('auth.logout')}
      </button>
    </div>
  )
}
