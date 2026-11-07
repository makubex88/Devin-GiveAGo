import { useState } from 'react'
import { parseMessage } from './api/parseMessage'
import { ErrorList } from './components/ErrorList'
import { MessageInput } from './components/MessageInput'
import { ParseSummary } from './components/ParseSummary'
import { SegmentList } from './components/SegmentList'
import { validSample } from './sampleMessages'
import type { ParseResponse } from './types/hl7'

function App() {
  const [message, setMessage] = useState(validSample)
  const [result, setResult] = useState<ParseResponse | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [showTechnical, setShowTechnical] = useState(false)

  async function handleParse() {
    setIsParsing(true)
    setRequestError(null)
    setSelectedLine(null)
    try {
      setResult(await parseMessage(message))
    } catch (error) {
      setResult(null)
      const detail = error instanceof Error ? ` (${error.message})` : ''
      setRequestError(`We couldn't check the message because the checking service didn't respond. Please make sure it is running and try again.${detail}`)
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <div className="min-h-screen text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-6 py-4">
          <h1 className="text-xl font-bold">HL7 Sentinel</h1>
          <span className="text-sm text-slate-500">Check an HL7 message and see what's inside, in plain language</span>
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={showTechnical}
              onChange={(e) => setShowTechnical(e.target.checked)}
            />
            Show technical details
          </label>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-7.5rem)]">
          <MessageInput value={message} isParsing={isParsing} onChange={setMessage} onParse={handleParse} />
        </div>
        <div className="space-y-4">
          {requestError && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {requestError}
            </div>
          )}
          {!result && !requestError && (
            <div className="space-y-3 rounded-lg border border-dashed border-slate-300 px-6 py-8 text-sm text-slate-600">
              <h2 className="text-base font-semibold text-slate-800">What does this do?</h2>
              <p>
                HL7 is the format hospitals, clinics and labs use to send information, such as patient details, orders and test
                results, between their computer systems. These messages are hard to read by eye.
              </p>
              <p>
                Paste a message on the left (or try an example) and click <span className="font-semibold">Check message</span>. We'll tell you
                whether it can be read, explain any problems and how to fix them, and show what's inside using everyday names.
              </p>
            </div>
          )}
          {result && (
            <>
              <ParseSummary result={result} showTechnical={showTechnical} />
              <ErrorList
                errors={result.errors}
                segmentLines={new Set(result.segments.map((s) => s.lineNumber))}
                showTechnical={showTechnical}
                onSelectLine={setSelectedLine}
              />
              <SegmentList segments={result.segments} errors={result.errors} selectedLine={selectedLine} showTechnical={showTechnical} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
