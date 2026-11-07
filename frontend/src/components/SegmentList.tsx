import { useEffect, useRef, useState } from 'react'
import { describeField, isStatRequest, sectionInfo } from '../glossary'
import type { Field, ParseError, Segment } from '../types/hl7'
import { fieldLabel } from './fieldLabel'

interface SegmentListProps {
  segments: Segment[]
  errors: ParseError[]
  selectedLine: number | null
  showTechnical: boolean
}

export function SegmentList({ segments, errors, selectedLine, showTechnical }: SegmentListProps) {
  if (segments.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">What's in the message</h2>
      {segments.map((segment) => (
        <SegmentCard
          key={segment.index}
          segment={segment}
          errors={errors.filter((e) => e.lineNumber === segment.lineNumber)}
          isSelected={selectedLine === segment.lineNumber}
          showTechnical={showTechnical}
        />
      ))}
    </section>
  )
}

interface SegmentCardProps {
  segment: Segment
  errors: ParseError[]
  isSelected: boolean
  showTechnical: boolean
}

const separatorFields = new Set([1, 2])

function SegmentCard({ segment, errors, isSelected, showTechnical }: SegmentCardProps) {
  const [isOpen, setIsOpen] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const hasError = errors.some((e) => e.severity === 'Error')
  const hasWarning = errors.some((e) => e.severity === 'Warning')
  const flaggedFields = new Set(errors.map((e) => e.fieldPosition).filter((p): p is number => p !== null))
  const info = sectionInfo(segment.id)
  const fields = showTechnical
    ? segment.fields
    : segment.fields.filter((f) => !f.isEmpty && !(segment.id === 'MSH' && separatorFields.has(f.position)))

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
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{info.name}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{segment.id}</span>
            {isStatRequest(segment) && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">Urgent (STAT)</span>
            )}
            <span className="text-xs text-slate-500">
              Line {segment.lineNumber}
              {showTechnical && ` · ${segment.fields.length} fields · ${segment.isSupported ? segment.segmentType : 'generic'}`}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-slate-500">{info.description}</div>
        </div>
        <span className="text-xs text-slate-400">{isOpen ? 'Hide' : 'Show'}</span>
      </button>
      {isOpen &&
        (fields.length === 0 ? (
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500 italic">No information filled in.</div>
        ) : (
          <table className="w-full border-t border-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                {showTechnical && <th className="w-20 px-4 py-1.5 font-medium">Code</th>}
                <th className="w-2/5 px-4 py-1.5 font-medium">What it is</th>
                <th className="px-4 py-1.5 font-medium">Value</th>
                {showTechnical && <th className="px-4 py-1.5 font-medium">Raw parts</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fields.map((field) => (
                <FieldRow
                  key={field.position}
                  segmentId={segment.id}
                  field={field}
                  isFlagged={flaggedFields.has(field.position)}
                  showTechnical={showTechnical}
                />
              ))}
            </tbody>
          </table>
        ))}
    </div>
  )
}

interface FieldRowProps {
  segmentId: string
  field: Field
  isFlagged: boolean
  showTechnical: boolean
}

function FieldRow({ segmentId, field, isFlagged, showTechnical }: FieldRowProps) {
  const description = describeField(segmentId, field)

  return (
    <tr className={isFlagged ? 'bg-rose-50' : undefined}>
      {showTechnical && <td className="px-4 py-2 align-top font-mono text-xs font-semibold text-slate-700">{fieldLabel(segmentId, field.position)}</td>}
      <td className="px-4 py-2 align-top">
        <div className="text-slate-800">{description.name}</div>
        {description.hint && <div className="text-xs text-slate-500">{description.hint}</div>}
      </td>
      <td className="px-4 py-2 align-top break-words text-slate-900">
        {description.text !== null && <span>{description.text}</span>}
        {description.entries.length > 0 && (
          <div className="space-y-2">
            {description.entries.map((entry, i) => (
              <dl key={i} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                {description.entries.length > 1 && <div className="col-span-2 text-xs font-medium text-slate-500">Entry {i + 1}</div>}
                {entry.map((part) => (
                  <div key={part.label} className="contents">
                    <dt className="text-xs leading-5 text-slate-500">{part.label}</dt>
                    <dd>{part.value}</dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>
        )}
        {description.text === null && description.entries.length === 0 && <span className="text-slate-400 italic">Not filled in</span>}
      </td>
      {showTechnical && (
        <td className="px-4 py-2 align-top font-mono text-xs">
          <div className="break-all text-slate-700">{field.isEmpty ? <span className="text-slate-400 italic">empty</span> : field.value}</div>
          <RawParts field={field} />
        </td>
      )}
    </tr>
  )
}

function RawParts({ field }: { field: Field }) {
  const isComposite =
    field.repetitions.length > 1 ||
    field.repetitions.some((r) => r.components.length > 1 || r.components.some((c) => c.subcomponents.length > 1))
  if (!isComposite) {
    return null
  }

  return (
    <div className="mt-1 space-y-1">
      {field.repetitions.map((rep) => (
        <div key={rep.index} className="flex flex-wrap gap-1">
          {field.repetitions.length > 1 && <span className="text-slate-400">~{rep.index}</span>}
          {rep.components.map((component) => (
            <span key={component.position} className="rounded bg-slate-100 px-1.5 py-0.5">
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
  )
}
