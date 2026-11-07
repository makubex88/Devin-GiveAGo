import { fieldInfo, problemExplanations, sectionInfo, severityLabels } from '../glossary'
import type { ParseError } from '../types/hl7'
import { fieldLabel } from './fieldLabel'

interface ErrorListProps {
  errors: ParseError[]
  segmentLines: ReadonlySet<number>
  showTechnical: boolean
  onSelectLine: (lineNumber: number) => void
}

export function ErrorList({ errors, segmentLines, showTechnical, onSelectLine }: ErrorListProps) {
  if (errors.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">What we found</h2>
      <ul className="divide-y divide-slate-100">
        {errors.map((error, i) => {
          const problem = problemExplanations[error.code]
          const lineNumber = error.lineNumber
          const where = [
            lineNumber !== null ? `Line ${lineNumber}` : null,
            error.segmentId ? sectionInfo(error.segmentId).name : null,
            error.segmentId && error.fieldPosition !== null ? fieldInfo(error.segmentId, error.fieldPosition).name : null,
          ]
            .filter((part): part is string => Boolean(part))
            .join(' · ')

          return (
            <li key={`${error.code}-${i}`} className="flex items-start gap-3 px-4 py-3 text-sm">
              <span
                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                  error.severity === 'Error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {severityLabels[error.severity]}
              </span>
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-slate-900">{problem.title}</div>
                <div className="text-slate-700">{problem.explanation}</div>
                <div className="text-slate-700">
                  <span className="font-medium">How to fix: </span>
                  {problem.fix}
                </div>
                {where && <div className="text-xs text-slate-500">Where: {where}</div>}
                {showTechnical && (
                  <div className="font-mono text-xs text-slate-500">
                    {error.code}
                    {error.segmentId && error.fieldPosition !== null ? ` · ${fieldLabel(error.segmentId, error.fieldPosition)}` : ''} — {error.message}
                  </div>
                )}
              </div>
              {lineNumber !== null && segmentLines.has(lineNumber) && (
                <button type="button" className="shrink-0 text-xs font-medium text-indigo-600 hover:underline" onClick={() => onSelectLine(lineNumber)}>
                  Show me
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
