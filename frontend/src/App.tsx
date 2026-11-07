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

  async function handleParse() {
    setIsParsing(true)
    setRequestError(null)
    setSelectedLine(null)
    try {
      setResult(await parseMessage(message))
    } catch (error) {
      setResult(null)
      setRequestError(error instanceof Error ? error.message : 'The parse request failed.')
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <div className="min-h-screen text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-baseline gap-3 px-6 py-4">
          <h1 className="text-xl font-bold">HL7 Sentinel</h1>
          <span className="text-sm text-slate-500">HL7 v2 message parser</span>
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
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500">
              Paste a message and click <span className="font-semibold">Parse</span> to inspect its segments and fields.
            </div>
          )}
          {result && (
            <>
              <ParseSummary result={result} />
              <ErrorList errors={result.errors} onSelectLine={setSelectedLine} />
              <SegmentList segments={result.segments} errors={result.errors} selectedLine={selectedLine} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
