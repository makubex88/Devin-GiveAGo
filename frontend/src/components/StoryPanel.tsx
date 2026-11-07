import type { StoryStep } from '../sampleMessages'

interface StoryPanelProps {
  steps: StoryStep[]
  segmentLines: ReadonlySet<number>
  onSelectLine: (lineNumber: number) => void
}

export function StoryPanel({ steps, segmentLines, onSelectLine }: StoryPanelProps) {
  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-slate-900">The story behind this example</h2>
        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">Urgent (STAT)</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">Everyone and everything in this story is made up.</p>
      <ol className="mt-3 space-y-3">
        {steps.map((step, i) => {
          const canJump = step.lineNumber !== null && segmentLines.has(step.lineNumber)
          return (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <div className="flex-1 text-sm">
                <div className="font-medium text-slate-900">{step.title}</div>
                <p className="text-slate-700">{step.text}</p>
              </div>
              {canJump && step.lineNumber !== null && (
                <button
                  type="button"
                  className="self-start text-xs whitespace-nowrap text-indigo-600 hover:underline"
                  onClick={() => step.lineNumber !== null && onSelectLine(step.lineNumber)}
                >
                  Show me
                </button>
              )}
            </li>
          )
        })}
      </ol>
      {segmentLines.size === 0 && (
        <p className="mt-3 text-xs text-slate-600">
          Click <span className="font-semibold">Check message</span> to see each step in the message.
        </p>
      )}
    </section>
  )
}
