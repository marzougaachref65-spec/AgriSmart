import { useId } from 'react'

export default function Input({
  label,
  icon: Icone,
  error,
  droite,
  className = '',
  ...props
}) {
  const id = useId()

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icone && (
          <Icone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}

        <input
          id={id}
          className={[
            'w-full rounded-xl border bg-white py-2.5 text-sm text-slate-800',
            'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition',
            Icone ? 'pl-10' : 'pl-3',
            droite ? 'pr-11' : 'pr-3',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500',
            className,
          ].join(' ')}
          {...props}
        />

        {droite && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{droite}</div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
