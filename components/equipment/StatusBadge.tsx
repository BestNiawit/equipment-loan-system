import { CheckCircle2, Clock, AlertCircle, Wrench } from 'lucide-react'
import { EquipmentStatus } from '@/lib/types'
import { statusConfig } from '@/lib/utils'

const icons: Record<EquipmentStatus, React.ReactNode> = {
  available: <CheckCircle2 className="w-3.5 h-3.5" />,
  borrowed: <Clock className="w-3.5 h-3.5" />,
  overdue: <AlertCircle className="w-3.5 h-3.5" />,
  maintenance: <Wrench className="w-3.5 h-3.5" />,
}

interface StatusBadgeProps {
  status: EquipmentStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border
        ${config.bg} ${config.color} ${config.border}
        ${config.darkBg} ${config.darkText} ${config.darkBorder}
        ${padding}`}
    >
      {icons[status]}
      {config.label}
    </span>
  )
}
