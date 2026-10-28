import { HashRouter, Route, Routes } from 'react-router'
import { useTranslation } from 'react-i18next'
import { TabBar } from './components/TabBar'
import { ComingSoon } from './screens/ComingSoon'
import { Home } from './screens/Home'

// Hash routing so deep links work on GitHub Pages without a 404 fallback.
export default function App() {
  const { t } = useTranslation()
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<ComingSoon title={t('tabs.calendar')} />} />
        <Route path="/log" element={<ComingSoon title={t('tabs.add')} />} />
        <Route path="/insights" element={<ComingSoon title={t('tabs.insights')} />} />
        <Route path="/more" element={<ComingSoon title={t('tabs.more')} />} />
      </Routes>
      <TabBar />
    </HashRouter>
  )
}
