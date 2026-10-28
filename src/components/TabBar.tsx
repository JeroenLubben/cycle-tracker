import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Icon, type IconName } from './Icon'
import styles from './TabBar.module.css'

const tabs: { to: string; icon: IconName; key: string }[] = [
  { to: '/', icon: 'home', key: 'home' },
  { to: '/calendar', icon: 'calendar', key: 'calendar' },
  { to: '/insights', icon: 'insights', key: 'insights' },
  { to: '/more', icon: 'settings', key: 'more' },
]

export function TabBar() {
  const { t } = useTranslation()
  const tab = ({ to, icon, key }: (typeof tabs)[number]) => (
    <NavLink key={key} to={to} end className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>
      <Icon name={icon} />
      <span>{t(`tabs.${key}`)}</span>
    </NavLink>
  )

  return (
    <nav className={styles.bar}>
      {tabs.slice(0, 2).map(tab)}
      <NavLink to="/log" className={styles.fab} aria-label={t('tabs.add')}>
        <Icon name="plus" size={28} />
      </NavLink>
      {tabs.slice(2).map(tab)}
    </nav>
  )
}
