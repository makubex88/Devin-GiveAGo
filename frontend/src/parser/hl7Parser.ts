// TypeScript port of HL7Sentinel.Core's Hl7Parser (default options: delimiters read from MSH, CR/LF/CRLF terminators).
// Produces the same JSON as the C# POST /api/parse endpoint; parity-fixtures.json is checked by both test suites.
import type {
  Component,
  Delimiters,
  Field,
  Hl7ParseErrorCode,
  Hl7ParseErrorSeverity,
  Hl7SegmentType,
  ParseError,
  ParseResponse,
  Repetition,
  Segment,
} from '../types/hl7.js'

const MSH = 'MSH'

const supportedSegments: Record<string, Hl7SegmentType | undefined> = {
  MSH: 'MSH',
  PID: 'PID',
  PV1: 'PV1',
  ORC: 'ORC',
  OBR: 'OBR',
  OBX: 'OBX',
}

// Mirrors .NET char.IsLetterOrDigit, char.IsWhiteSpace and char.IsControl for a single UTF-16 code unit.
const letterOrDigit = /^[\p{L}\p{Nd}]$/u
const whiteSpace = /^[\p{Zs}\p{Zl}\p{Zp}\t\n\v\f\r\u0085]$/u
const control = /^\p{Cc}$/u
const allWhiteSpace = /^[\p{Zs}\p{Zl}\p{Zp}\t\n\v\f\r\u0085]*$/u

interface SourceLine {
  lineNumber: number
  text: string
}

class ErrorList {
  readonly items: ParseError[] = []

  add(
    code: Hl7ParseErrorCode,
    severity: Hl7ParseErrorSeverity,
    message: string,
    lineNumber: number | null = null,
    segmentId: string | null = null,
    fieldPosition: number | null = null,
  ) {
    this.items.push({ code, severity, message, lineNumber, segmentId, fieldPosition })
  }
}

export function parseHl7(message: string): ParseResponse {
  const errors = new ErrorList()
  const lines = splitSegments(message)

  if (lines.length === 0) {
    errors.add('EmptyMessage', 'Error', 'The message is empty.')
    return result(null, [], errors)
  }

  const header = lines.find(isMshLine) ?? null
  const delimiters = resolveHeaderDelimiters(header, errors)
  if (delimiters === null) {
    return result(null, [], errors)
  }

  if (header !== null && header !== lines[0]) {
    errors.add(
      'MshNotFirstSegment',
      'Error',
      `The MSH segment must be the first segment but was found on line ${header.lineNumber}.`,
      header.lineNumber,
      MSH,
    )
  }

  const segments: Segment[] = []
  for (const line of lines) {
    segments.push(parseSegment(line, segments.length, delimiters, line === header, errors))
  }

  return result(delimiters, segments, errors)
}

function result(delimiters: Delimiters | null, segments: Segment[], errors: ErrorList): ParseResponse {
  const hasErrors = errors.items.some((e) => e.severity === 'Error')
  return { isSuccess: delimiters !== null && !hasErrors, delimiters, segments, errors: errors.items }
}

function splitSegments(message: string): SourceLine[] {
  const lines: SourceLine[] = []
  let lineNumber = 1
  let start = 0

  for (let i = 0; i < message.length; i++) {
    const c = message[i]
    if (c !== '\r' && c !== '\n') {
      continue
    }
    addLine(lines, message.slice(start, i), lineNumber)
    if (c === '\r' && message[i + 1] === '\n') {
      i++
    }
    start = i + 1
    lineNumber++
  }

  addLine(lines, message.slice(start), lineNumber)
  return lines
}

function addLine(lines: SourceLine[], text: string, lineNumber: number) {
  if (!allWhiteSpace.test(text)) {
    lines.push({ lineNumber, text })
  }
}

function isMshLine(line: SourceLine): boolean {
  return line.text.startsWith(MSH) && (line.text.length === MSH.length || !letterOrDigit.test(line.text[MSH.length]))
}

function declaredEncodingCharacters(mshText: string, fieldSeparator: string): string {
  const start = 4
  if (mshText.length <= start) {
    return ''
  }
  const end = mshText.indexOf(fieldSeparator, start)
  return end < 0 ? mshText.slice(start) : mshText.slice(start, end)
}

function fromEncodingCharacters(fieldSeparator: string, encoding: string): Delimiters | null {
  if (encoding.length !== 4 && encoding.length !== 5) {
    return null
  }
  return {
    fieldSeparator,
    componentSeparator: encoding[0],
    repetitionSeparator: encoding[1],
    escapeCharacter: encoding[2],
    subcomponentSeparator: encoding[3],
    truncationCharacter: encoding.length === 5 ? encoding[4] : null,
    encodingCharacters: encoding,
  }
}

function printable(value: string): string {
  return control.test(value) ? `\\u${value.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}` : value
}

function validateDelimiters(d: Delimiters): string[] {
  const named: [string, string][] = [
    ['field separator', d.fieldSeparator],
    ['component separator', d.componentSeparator],
    ['repetition separator', d.repetitionSeparator],
    ['escape character', d.escapeCharacter],
    ['subcomponent separator', d.subcomponentSeparator],
  ]
  if (d.truncationCharacter !== null) {
    named.push(['truncation character', d.truncationCharacter])
  }

  const problems: string[] = []
  for (const [name, value] of named) {
    if (letterOrDigit.test(value) || whiteSpace.test(value) || control.test(value)) {
      problems.push(`The ${name} '${printable(value)}' must not be a letter, digit, whitespace or control character.`)
    }
  }
  for (let i = 0; i < named.length; i++) {
    for (let j = i + 1; j < named.length; j++) {
      if (named[i][1] === named[j][1]) {
        problems.push(`The ${named[i][0]} and ${named[j][0]} are both '${printable(named[i][1])}'; delimiters must be distinct.`)
      }
    }
  }
  return problems
}

function resolveHeaderDelimiters(header: SourceLine | null, errors: ErrorList): Delimiters | null {
  if (header === null) {
    errors.add('MissingMshSegment', 'Error', 'No MSH segment was found; delimiters cannot be determined.')
    return null
  }

  if (header.text.length <= MSH.length) {
    errors.add('MalformedMshSegment', 'Error', 'The MSH segment does not declare a field separator (MSH-1).', header.lineNumber, MSH, 1)
    return null
  }

  const fieldSeparator = header.text[MSH.length]
  const encoding = declaredEncodingCharacters(header.text, fieldSeparator)
  const delimiters = fromEncodingCharacters(fieldSeparator, encoding)
  if (delimiters === null) {
    errors.add(
      'InvalidEncodingCharacters',
      'Error',
      `MSH-2 must contain 4 or 5 encoding characters but contained ${encoding.length} ('${encoding}').`,
      header.lineNumber,
      MSH,
      2,
    )
    return null
  }

  const problems = validateDelimiters(delimiters)
  for (const problem of problems) {
    errors.add('InvalidDelimiters', 'Error', problem, header.lineNumber, MSH, 2)
  }
  return problems.length === 0 ? delimiters : null
}

function parseSegment(line: SourceLine, index: number, d: Delimiters, isHeader: boolean, errors: ErrorList): Segment {
  if (isMshLine(line)) {
    return parseMshSegment(line, index, d, isHeader, errors)
  }

  const parts = line.text.split(d.fieldSeparator)
  const id = parts[0]
  const fields = parts.slice(1).map((value, i) => parseField(i + 1, value, d))
  const segmentType = resolveSegmentType(id, line.lineNumber, errors)
  return segment(id, segmentType, index, line, fields)
}

function segment(id: string, segmentType: Hl7SegmentType, index: number, line: SourceLine, fields: Field[]): Segment {
  return { index, lineNumber: line.lineNumber, id, segmentType, isSupported: segmentType !== 'Unsupported', value: line.text, fields }
}

function parseMshSegment(line: SourceLine, index: number, d: Delimiters, isHeader: boolean, errors: ErrorList): Segment {
  if (!isHeader) {
    errors.add(
      'MultipleMshSegments',
      'Warning',
      `An additional MSH segment was found on line ${line.lineNumber}; batch messages are parsed as a single message.`,
      line.lineNumber,
      MSH,
    )
  }

  const text = line.text
  const fields: Field[] = []
  if (text.length <= MSH.length) {
    errors.add('MalformedMshSegment', 'Error', 'The MSH segment does not declare a field separator (MSH-1).', line.lineNumber, MSH, 1)
    return segment(MSH, 'MSH', index, line, fields)
  }

  // MSH-1 is the field separator itself and MSH-2 the raw encoding characters; neither is split.
  const declaredSeparator = text[MSH.length]
  if (declaredSeparator !== d.fieldSeparator) {
    errors.add(
      'DelimiterMismatch',
      'Error',
      `MSH-1 declares field separator '${declaredSeparator}' but '${d.fieldSeparator}' was used.`,
      line.lineNumber,
      MSH,
      1,
    )
  }

  fields.push(literalField(1, declaredSeparator))
  const parts = text.slice(MSH.length + 1).split(d.fieldSeparator)
  fields.push(literalField(2, parts[0]))
  for (let i = 1; i < parts.length; i++) {
    fields.push(parseField(i + 2, parts[i], d))
  }
  return segment(MSH, 'MSH', index, line, fields)
}

function resolveSegmentType(id: string, lineNumber: number, errors: ErrorList): Hl7SegmentType {
  if (!/^[A-Z][A-Z0-9]{2}$/.test(id)) {
    errors.add(
      'InvalidSegmentId',
      'Error',
      `'${id}' is not a valid segment identifier; expected three uppercase letters or digits starting with a letter.`,
      lineNumber,
      id,
    )
    return 'Unsupported'
  }

  const segmentType = supportedSegments[id]
  if (segmentType !== undefined) {
    return segmentType
  }

  errors.add('UnsupportedSegment', 'Warning', `Segment '${id}' is not a supported segment type; it was parsed generically.`, lineNumber, id)
  return 'Unsupported'
}

const nullValue = '""'

function field(position: number, value: string, repetitions: Repetition[]): Field {
  return { position, value, isEmpty: value.length === 0, isNull: value === nullValue, repetitions }
}

function literalField(position: number, value: string): Field {
  return field(position, value, [{ index: 1, value, components: [{ position: 1, value, subcomponents: [{ position: 1, value }] }] }])
}

function parseField(position: number, value: string, d: Delimiters): Field {
  return field(
    position,
    value,
    value.split(d.repetitionSeparator).map((rep, r) => ({
      index: r + 1,
      value: rep,
      components: rep.split(d.componentSeparator).map(
        (comp, c): Component => ({
          position: c + 1,
          value: comp,
          subcomponents: comp.split(d.subcomponentSeparator).map((sub, s) => ({ position: s + 1, value: sub })),
        }),
      ),
    })),
  )
}
