import type { ParseResponse } from '../types/hl7'

export class ParseRequestError extends Error {
  readonly status: number
  readonly detail: string | null

  constructor(status: number, detail: string | null) {
    super(`Parse request failed with HTTP ${status}.`)
    this.name = 'ParseRequestError'
    this.status = status
    this.detail = detail
  }
}

async function readProblemDetail(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'errors' in body && typeof body.errors === 'object' && body.errors !== null) {
      const first: unknown = Object.values(body.errors).flat()[0]
      return typeof first === 'string' ? first : null
    }
  } catch {
    // Not a problem-details body.
  }
  return null
}

export async function parseMessage(message: string, signal?: AbortSignal): Promise<ParseResponse> {
  const response = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  })

  if (!response.ok) {
    throw new ParseRequestError(response.status, await readProblemDetail(response))
  }

  return (await response.json()) as ParseResponse
}
