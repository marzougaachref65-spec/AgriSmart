const variantes = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500',
}

const tailles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
}

export function buttonStyles(variante = 'primary', taille = 'md', className = '') {
  return [
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
    'transition-colors focus:outline-none focus-visible:ring-2',
    'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    variantes[variante] ?? variantes.primary,
    tailles[taille] ?? tailles.md,
    className,
  ].join(' ')
}

export default function Button({
  variante = 'primary',
  taille = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={buttonStyles(variante, taille, className)}
      {...props}
    >
      {children}
    </button>
  )
}
