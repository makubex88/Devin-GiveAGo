import type { ParseResponse } from '../types/hl7'

export async function parseMessage(message: string, signal?: AbortSignal): Promise<ParseResponse> {
  const response = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Parse request failed with HTTP ${response.status}.`)
  }

  return (await response.json()) as ParseResponse
}
