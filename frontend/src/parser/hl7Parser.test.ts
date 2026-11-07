import { describe, expect, it } from 'vitest'
import type { ParseResponse } from '../types/hl7'
import { handleParseRequest, maxMessageLength } from './handleParseRequest'
import { parseHl7 } from './hl7Parser'
import fixtures from './parity-fixtures.json'

interface ParityFixture {
  name: string
  message: string
  expected: ParseResponse
}

// Expected outputs were captured from the C# POST /api/parse; ParityFixtureTests.cs checks the C# side against the same file.
describe('parity with the C# parser', () => {
  it.each((fixtures as ParityFixture[]).map((f) => [f.name, f] as const))('%s', (_name, fixture) => {
    expect(parseHl7(fixture.message)).toEqual(fixture.expected)
  })
})

describe('parseHl7', () => {
  it('keeps MSH-1 as the separator and MSH-2 unsplit', () => {
    const msh = parseHl7('MSH|^~\\&|APP||FAC').segments[0]
    expect(msh.fields.map((f) => [f.position, f.value])).toEqual([
      [1, '|'],
      [2, '^~\\&'],
      [3, 'APP'],
      [4, ''],
      [5, 'FAC'],
    ])
    expect(msh.fields[1].repetitions[0].components).toHaveLength(1)
  })

  it('preserves empty fields and their positions', () => {
    const pid = parseHl7('MSH|^~\\&|A\rPID|1|||NAME').segments[1]
    expect(pid.fields.map((f) => [f.position, f.isEmpty])).toEqual([
      [1, false],
      [2, true],
      [3, true],
      [4, false],
    ])
  })
})

function post(body: string): Promise<Response> {
  return handleParseRequest(new Request('http://localhost/api/parse', { method: 'POST', body }))
}

describe('handleParseRequest', () => {
  it('returns the parse result as JSON', async () => {
    const response = await post(JSON.stringify({ message: 'MSH|^~\\&|A\rPID|1' }))
    expect(response.status).toBe(200)
    const body = (await response.json()) as ParseResponse
    expect(body.isSuccess).toBe(true)
    expect(body.segments.map((s) => s.id)).toEqual(['MSH', 'PID'])
  })

  it('returns 200 with isSuccess false for an unparseable message', async () => {
    const response = await post(JSON.stringify({ message: '' }))
    expect(response.status).toBe(200)
    expect(((await response.json()) as ParseResponse).errors[0].code).toBe('EmptyMessage')
  })

  it.each([
    ['missing message', '{}'],
    ['non-string message', '{"message":42}'],
    ['invalid JSON', 'not json'],
  ])('rejects %s with 400', async (_name, body) => {
    expect((await post(body)).status).toBe(400)
  })

  it('rejects messages over the length limit with 400', async () => {
    const response = await post(JSON.stringify({ message: 'MSH|^~\\&|' + 'x'.repeat(maxMessageLength) }))
    expect(response.status).toBe(400)
    const body = (await response.json()) as { errors: { Message: string[] } }
    expect(body.errors.Message[0]).toContain('50,000')
  })

  it('rejects a separator-heavy message whose response would be too large with 413', async () => {
    const message = 'MSH|^~\\&|' + '|'.repeat(maxMessageLength - 9)
    expect((await post(JSON.stringify({ message }))).status).toBe(413)
  })
})
