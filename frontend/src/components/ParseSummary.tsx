import type { ParseResponse } from '../types/hl7'

interface ParseSummaryProps {
  result: ParseResponse
}

export function ParseSummary({ result }: ParseSummaryProps) {
  const errorCount = result.errors.filter((e) => e.severity === 'Error').length
  const warningCount = result.errors.length - errorCount
  const d = result.delimiters

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Status" value={result.isSuccess ? 'Parsed' : 'Failed'} tone={result.isSuccess ? 'good' : 'bad'} />
      <Stat label="Segments" value={String(result.segments.length)} />
      <Stat label="Errors / warnings" value={`${errorCount} / ${warningCount}`} tone={errorCount > 0 ? 'bad' : warningCount > 0 ? 'warn' : 'neutral'} />
      <Stat label="Delimiters (MSH-1, MSH-2)" value={d ? `${d.fieldSeparator}  ${d.encodingCharacters}` : '—'} mono />
    </section>
  )
}

type Tone = 'good' | 'bad' | 'warn' | 'neutral'

const toneClass: Record<Tone, string> = {
  good: 'text-emerald-700',
  bad: 'text-rose-700',
  warn: 'text-amber-700',
  neutral: 'text-slate-800',
}

function Stat({ label, value, tone = 'neutral', mono = false }: { label: string; value: string; tone?: Tone; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${toneClass[tone]} ${mono ? 'font-mono whitespace-pre' : ''}`}>{value}</div>
    </div>
  )
}
