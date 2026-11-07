import { describeField } from '../glossary'
import type { ParseResponse } from '../types/hl7'

interface ParseSummaryProps {
  result: ParseResponse
  showTechnical: boolean
}

export function ParseSummary({ result, showTechnical }: ParseSummaryProps) {
  const errorCount = result.errors.filter((e) => e.severity === 'Error').length
  const warningCount = result.errors.length - errorCount
  const d = result.delimiters
  const header = result.segments.find((s) => s.id === 'MSH')
  const messageTypeField = header?.fields.find((f) => f.position === 9)
  const messageType = messageTypeField ? describeField('MSH', messageTypeField).text : null

  const banner =
    errorCount > 0
      ? {
          tone: 'border-rose-200 bg-rose-50 text-rose-900',
          title: `This message has ${plural(errorCount, 'problem')} that ${errorCount === 1 ? 'needs' : 'need'} fixing`,
          detail:
            warningCount > 0
              ? `There ${warningCount === 1 ? 'is' : 'are'} also ${plural(warningCount, 'thing')} worth checking. See the list below.`
              : 'See the list below for what is wrong and how to fix it.',
        }
      : warningCount > 0
        ? {
            tone: 'border-amber-200 bg-amber-50 text-amber-900',
            title: `This message can be read, with ${plural(warningCount, 'thing')} worth checking`,
            detail: 'Nothing stops the message being read, but have a look at the notes below.',
          }
        : {
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
            title: 'This message looks good',
            detail: `All ${plural(result.segments.length, 'section')} were read without any problems.`,
          }

  return (
    <section className="space-y-3">
      <div role="status" className={`rounded-lg border px-4 py-3 ${banner.tone}`}>
        <div className="text-base font-semibold">{banner.title}</div>
        <div className="mt-0.5 text-sm">{banner.detail}</div>
      </div>
      <div className={`grid grid-cols-2 gap-3 ${showTechnical ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
        <Stat label="Message type" value={messageType ?? 'Unknown'} />
        <Stat label="Sections" value={String(result.segments.length)} />
        <Stat label="Needs fixing" value={String(errorCount)} tone={errorCount > 0 ? 'bad' : 'neutral'} />
        <Stat label="Worth checking" value={String(warningCount)} tone={warningCount > 0 ? 'warn' : 'neutral'} />
        {showTechnical && <Stat label="Separators (MSH-1, MSH-2)" value={d ? `${d.fieldSeparator}  ${d.encodingCharacters}` : '—'} mono />}
      </div>
    </section>
  )
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

type Tone = 'bad' | 'warn' | 'neutral'

const toneClass: Record<Tone, string> = {
  bad: 'text-rose-700',
  warn: 'text-amber-700',
  neutral: 'text-slate-800',
}

function Stat({ label, value, tone = 'neutral', mono = false }: { label: string; value: string; tone?: Tone; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-base font-semibold ${toneClass[tone]} ${mono ? 'font-mono whitespace-pre' : ''}`}>{value}</div>
    </div>
  )
}
