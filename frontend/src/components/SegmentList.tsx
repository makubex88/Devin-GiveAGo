import { useEffect, useRef, useState } from 'react'
import type { Field, ParseError, Segment } from '../types/hl7'
import { fieldLabel } from './fieldLabel'

interface SegmentListProps {
  segments: Segment[]
  errors: ParseError[]
  selectedLine: number | null
}

export function SegmentList({ segments, errors, selectedLine }: SegmentListProps) {
  if (segments.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      {segments.map((segment) => (
        <SegmentCard
          key={segment.index}
          segment={segment}
          errors={errors.filter((e) => e.lineNumber === segment.lineNumber)}
          isSelected={selectedLine === segment.lineNumber}
        />
      ))}
    </section>
  )
}

interface SegmentCardProps {
  segment: Segment
  errors: ParseError[]
  isSelected: boolean
}

function SegmentCard({ segment, errors, isSelected }: SegmentCardProps) {
  const [isOpen, setIsOpen] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const hasError = errors.some((e) => e.severity === 'Error')
  const hasWarning = errors.some((e) => e.severity === 'Warning')
  const flaggedFields = new Set(errors.map((e) => e.fieldPosition).filter((p): p is number => p !== null))

  useEffect(() => {
    if (isSelected) {
      setIsOpen(true)
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isSelected])

  const border = hasError ? 'border-rose-300' : hasWarning ? 'border-amber-300' : 'border-slate-200'

  return (
    <div ref={ref} className={`rounded-lg border bg-white shadow-sm ${border} ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span className="font-mono text-sm font-bold text-slate-900">{segment.id}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-xs ${segment.isSupported ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
        >
          {segment.isSupported ? segment.segmentType : 'Generic'}
        </span>
        <span className="text-xs text-slate-500">
          Line {segment.lineNumber} · {segment.fields.length} fields
        </span>
        <span className="ml-auto text-xs text-slate-400">{isOpen ? 'Hide' : 'Show'}</span>
      </button>
      {isOpen && segment.fields.length > 0 && (
        <table className="w-full border-t border-slate-100 text-xs">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="w-20 px-4 py-1.5 font-medium">Field</th>
              <th className="px-4 py-1.5 font-medium">Raw value</th>
              <th className="px-4 py-1.5 font-medium">Components</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {segment.fields.map((field) => (
              <FieldRow key={field.position} segmentId={segment.id} field={field} isFlagged={flaggedFields.has(field.position)} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function FieldRow({ segmentId, field, isFlagged }: { segmentId: string; field: Field; isFlagged: boolean }) {
  const isComposite =
    field.repetitions.length > 1 ||
    field.repetitions.some((r) => r.components.length > 1 || r.components.some((c) => c.subcomponents.length > 1))

  return (
    <tr className={isFlagged ? 'bg-rose-50' : undefined}>
      <td className="px-4 py-1.5 align-top font-mono font-semibold text-slate-700">{fieldLabel(segmentId, field.position)}</td>
      <td className="px-4 py-1.5 align-top font-mono break-all text-slate-800">
        {field.isEmpty ? <span className="text-slate-400 italic">empty</span> : field.value}
        {field.isNull && <span className="ml-2 rounded bg-slate-100 px-1 text-slate-500">HL7 null</span>}
      </td>
      <td className="px-4 py-1.5 align-top">
        {isComposite && (
          <div className="space-y-1">
            {field.repetitions.map((rep) => (
              <div key={rep.index} className="flex flex-wrap gap-1">
                {field.repetitions.length > 1 && <span className="font-mono text-slate-400">~{rep.index}</span>}
                {rep.components.map((component) => (
                  <span key={component.position} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                    <span className="text-slate-400">.{component.position} </span>
                    {component.value.length === 0 ? (
                      <span className="text-slate-400 italic">empty</span>
                    ) : component.subcomponents.length > 1 ? (
                      component.subcomponents.map((sub) => (
                        <span key={sub.position} className="ml-0.5 rounded bg-white px-1">
                          <span className="text-slate-400">.{sub.position} </span>
                          {sub.value || <span className="text-slate-400 italic">empty</span>}
                        </span>
                      ))
                    ) : (
                      component.value
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  )
}
