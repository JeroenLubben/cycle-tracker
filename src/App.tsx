import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { TabBar } from './components/TabBar'
import { AppDataProvider } from './hooks/AppData'
import { useAppData } from './hooks/appDataContext'
import { Calendar } from './screens/Calendar'
import { ComingSoon } from './screens/ComingSoon'
import { DayLogRoute } from './screens/DayLog'
import { Home } from './screens/Home'
import { Onboarding } from './screens/Onboarding'

/** Sends first-time users to onboarding and hides the tab bar there. */
function Shell({ children }: { children: ReactNode }) {
  const { loading, settings } = useAppData()
  const { pathname } = useLocation()
  if (loading) return null
  const onboarding = pathname === '/welcome'
  if (!settings.onboarded && !onboarding) return <Navigate to="/welcome" replace />
  return (
    <>
      {children}
      {!onboarding && <TabBar />}
    </>
  )
}

// Hash routing so deep links work on GitHub Pages without a 404 fallback.
export default function App() {
  const { t } = useTranslation()
  return (
    <AppDataProvider>
      <HashRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/welcome" element={<Onboarding />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/log" element={<DayLogRoute />} />
            <Route path="/day/:date" element={<DayLogRoute />} />
            <Route path="/insights" element={<ComingSoon title={t('tabs.insights')} />} />
            <Route path="/more" element={<ComingSoon title={t('tabs.more')} />} />
          </Routes>
        </Shell>
      </HashRouter>
    </AppDataProvider>
  )
}
