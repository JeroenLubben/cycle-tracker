import { getCompanion, type Pose } from '../companions'

export function CompanionImage({ id, pose, size }: { id: string; pose: Pose; size: number }) {
  const companion = getCompanion(id)
  const src = import.meta.env.BASE_URL + (companion.poses[pose] ?? companion.poses.sitting)
  return <img src={src} width={size} height={size} alt="" draggable={false} />
}
