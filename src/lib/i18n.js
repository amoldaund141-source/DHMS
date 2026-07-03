import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en/translation.json'
import hi from '@/locales/hi/translation.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: localStorage.getItem('dhms_lang') ?? 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    returnNull: false,
  })

// Persist language choice
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('dhms_lang', lng)
  document.documentElement.lang = lng
})

export default i18n
