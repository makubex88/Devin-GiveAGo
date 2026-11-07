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
        <h2 className="text-sm font-semibold text-slate-700">Your HL7 message</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${buttonBase} bg-slate-100 text-slate-700 hover:bg-slate-200`} onClick={() => onChange(validSample)}>
            Try an example
          </button>
          <button type="button" className={`${buttonBase} bg-slate-100 text-slate-700 hover:bg-slate-200`} onClick={() => onChange(sampleWithIssues)}>
            Try an example with problems
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
        placeholder="Paste an HL7 message here. Each line is one section and starts with a 3-letter label, such as MSH or PID."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
        <span className="text-xs text-slate-500">Only use made-up test data. Never paste real patient information.</span>
        <button
          type="button"
          className={`${buttonBase} bg-indigo-600 text-white hover:bg-indigo-700`}
          disabled={isParsing || value.trim().length === 0}
          onClick={onParse}
        >
          {isParsing ? 'Checking…' : 'Check message'}
        </button>
      </footer>
    </section>
  )
}
