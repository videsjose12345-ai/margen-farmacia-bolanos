type BarColor = 'teal' | 'success' | 'warning' | 'danger' | 'purple' | 'lime'

const BAR_COLORS: Record<BarColor, string> = {
  teal:    'var(--teal)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
  purple:  '#7c3aed',
  lime:    '#84cc16',
}

interface Props {
  icon:    string
  label:   string
  value:   string
  sub?:    string
  color:   BarColor
  large?:  boolean
}

export default function KpiCard({ icon, label, value, sub, color, large }: Props) {
  return (
    <div
      className="rounded-[var(--r)] relative overflow-hidden cursor-default transition-transform hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: BAR_COLORS[color] }} />
      <div className="p-3">
        <div className="text-xl mb-1">{icon}</div>
        <div className="text-[0.59rem] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text2)' }}>{label}</div>
        <div className={`font-extrabold font-variant-numeric leading-tight ${large ? 'text-2xl' : 'text-[1.35rem]'}`}>{value}</div>
        {sub && <div className="text-[0.6rem] mt-0.5" style={{ color: 'var(--text2)' }}>{sub}</div>}
      </div>
    </div>
  )
}
