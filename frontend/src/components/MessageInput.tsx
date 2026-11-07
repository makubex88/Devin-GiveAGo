import { sampleWithIssues, validSample } from '../sampleMessages'

interface MessageInputProps {
  value: string
  isParsing: boolean
  onChange: (value: string) => void
  onParse: () => void
}

const buttonBase = 'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50'

export function MessageInput({ value, isParsing, onChange, onParse }: MessageInputProps) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-700">HL7 v2 message (ER7)</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${buttonBase} bg-slate-100 text-slate-700 hover:bg-slate-200`} onClick={() => onChange(validSample)}>
            Load sample
          </button>
          <button type="button" className={`${buttonBase} bg-slate-100 text-slate-700 hover:bg-slate-200`} onClick={() => onChange(sampleWithIssues)}>
            Load sample with issues
          </button>
          <button type="button" className={`${buttonBase} bg-slate-100 text-slate-700 hover:bg-slate-200`} onClick={() => onChange('')}>
            Clear
          </button>
        </div>
      </header>
      <textarea
        aria-label="HL7 message"
        className="min-h-80 flex-1 resize-none p-4 font-mono text-xs leading-relaxed text-slate-800 outline-none"
        spellCheck={false}
        placeholder="Paste an HL7 v2 message. Segments may be separated by CR, LF or CRLF."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
        <span className="text-xs text-slate-500">Use synthetic data only.</span>
        <button
          type="button"
          className={`${buttonBase} bg-indigo-600 text-white hover:bg-indigo-700`}
          disabled={isParsing || value.trim().length === 0}
          onClick={onParse}
        >
          {isParsing ? 'Parsing…' : 'Parse'}
        </button>
      </footer>
    </section>
  )
}
