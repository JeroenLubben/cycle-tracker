import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'

// Add new languages here (e.g. nl) once the English copy has settled.
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
