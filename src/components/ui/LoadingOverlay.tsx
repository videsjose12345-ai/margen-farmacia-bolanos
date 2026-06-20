interface Props { visible: boolean; message?: string }

export default function LoadingOverlay({ visible, message }: Props) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(5px)' }}>
      <div className="rounded-2xl p-8 max-w-sm w-11/12 text-center" style={{ background: 'var(--surface)', boxShadow: 'var(--sh-lg)' }}>
        <div className="w-9 h-9 border-[3px] border-t-teal-500 rounded-full animate-spin mx-auto mb-3"
             style={{ borderColor: 'var(--border)', borderTopColor: 'var(--teal)' }} />
        <div className="font-bold mb-1">Procesando…</div>
        <div className="text-sm" style={{ color: 'var(--text2)' }}>{message}</div>
        <div className="mt-4 h-1 rounded overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full w-1/3 rounded animate-[slide_1.2s_ease-in-out_infinite]"
               style={{ background: 'linear-gradient(90deg,var(--teal),#84cc16)' }} />
        </div>
      </div>
    </div>
  )
}
