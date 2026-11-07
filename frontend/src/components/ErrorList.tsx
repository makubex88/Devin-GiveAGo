import type { ParseError } from '../types/hl7'
import { fieldLabel } from './fieldLabel'

interface ErrorListProps {
  errors: ParseError[]
  onSelectLine: (lineNumber: number) => void
}

export function ErrorList({ errors, onSelectLine }: ErrorListProps) {
  if (errors.length === 0) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        No parsing errors or warnings.
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Diagnostics</h2>
      <ul className="divide-y divide-slate-100">
        {errors.map((error, i) => {
          const location = [
            error.lineNumber !== null ? `Line ${error.lineNumber}` : null,
            error.segmentId && error.fieldPosition !== null ? fieldLabel(error.segmentId, error.fieldPosition) : error.segmentId,
          ]
            .filter((part): part is string => Boolean(part))
            .join(' · ')
          const lineNumber = error.lineNumber

          return (
            <li key={`${error.code}-${i}`} className="flex items-start gap-3 px-4 py-2.5 text-sm">
              <span
                className={`mt-0.5 rounded px-1.5 py-0.5 text-xs font-semibold ${
                  error.severity === 'Error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {error.severity}
              </span>
              <div className="flex-1">
                <div className="font-mono text-xs text-slate-500">{error.code}</div>
                <div className="text-slate-800">{error.message}</div>
              </div>
              {location &&
                (lineNumber !== null ? (
                  <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={() => onSelectLine(lineNumber)}>
                    {location}
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">{location}</span>
                ))}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
