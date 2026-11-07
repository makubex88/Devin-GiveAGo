import { parseHl7 } from './hl7Parser'

// Lower than the C# API's 1,000,000 because Vercel caps function responses at 4.5 MB.
export const maxMessageLength = 50_000
export const maxResponseBytes = 4_000_000

function problem(status: number, detail: string): Response {
  return Response.json(
    { title: 'One or more validation errors occurred.', status, errors: { Message: [detail] } },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

export async function handleParseRequest(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return problem(400, 'The request body must be JSON like { "message": "MSH|..." }.')
  }

  const message = typeof body === 'object' && body !== null && 'message' in body ? body.message : undefined
  if (typeof message !== 'string') {
    return problem(400, 'A message is required.')
  }
  if (message.length > maxMessageLength) {
    return problem(400, `The message must not exceed ${maxMessageLength.toLocaleString('en-US')} characters.`)
  }

  const json = JSON.stringify(parseHl7(message))
  if (new TextEncoder().encode(json).length > maxResponseBytes) {
    return problem(413, 'The message has too many parts to show. Please check a smaller message.')
  }
  return new Response(json, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
