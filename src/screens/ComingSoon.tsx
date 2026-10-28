import { CompanionImage } from '../components/CompanionImage'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '96px 24px' }}>
      <h1>{title}</h1>
      <CompanionImage id="bear" pose="sitting" size={120} />
      <p style={{ color: 'var(--color-text-muted)' }}>Coming soon</p>
    </div>
  )
}
