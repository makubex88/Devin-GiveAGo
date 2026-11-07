import type { ParseResponse } from '../types/hl7'

export class ParseRequestError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Parse request failed with HTTP ${status}.`)
    this.name = 'ParseRequestError'
    this.status = status
  }
}

export async function parseMessage(message: string, signal?: AbortSignal): Promise<ParseResponse> {
  const response = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  })

  if (!response.ok) {
    throw new ParseRequestError(response.status)
  }

  return (await response.json()) as ParseResponse
}
