// Plain-language names for HL7 v2 sections, fields and standard code tables (HL7 v2.5.1).
import type { Field, Hl7ParseErrorCode, Hl7ParseErrorSeverity, Segment } from './types/hl7'

export interface SectionInfo {
  name: string
  description: string
}

const sections: Record<string, SectionInfo | undefined> = {
  MSH: { name: 'Message header', description: 'Who sent the message, who it is for, when it was sent and what kind of message it is.' },
  EVN: { name: 'Event', description: 'What happened that caused this message to be sent.' },
  PID: { name: 'Patient details', description: 'Who the patient is: identifiers, name, date of birth and address.' },
  PV1: { name: 'Visit details', description: "The patient's visit: what kind of visit it is, where they are and who is looking after them." },
  ORC: { name: 'Order', description: 'General information about an order, such as its order numbers and what is happening to it.' },
  OBR: { name: 'Test request', description: 'Which test or service was requested.' },
  OBX: { name: 'Result', description: 'A single result or observation, with its value and units.' },
  NK1: { name: 'Next of kin', description: "The patient's next of kin or emergency contact." },
  AL1: { name: 'Allergy', description: 'An allergy the patient has.' },
  DG1: { name: 'Diagnosis', description: 'A diagnosis recorded for the patient.' },
  NTE: { name: 'Note', description: 'A free-text note or comment.' },
}

export function sectionInfo(segmentId: string): SectionInfo {
  return sections[segmentId] ?? { name: 'Other section', description: "This tool doesn't describe this kind of section yet, but its contents are still shown." }
}

type FieldNames = Record<number, string | [name: string, hint: string] | undefined>

const fieldNames: Record<string, FieldNames | undefined> = {
  MSH: {
    1: ['Field separator', 'The character that separates values on each line'],
    2: ['Encoding characters', 'The characters used to split values into smaller parts'],
    3: 'Sending application',
    4: 'Sending facility',
    5: 'Receiving application',
    6: 'Receiving facility',
    7: 'Date and time sent',
    8: 'Security',
    9: 'Message type',
    10: ['Message ID', 'A unique reference for this message'],
    11: 'Processing mode',
    12: 'HL7 version',
    13: 'Sequence number',
    15: 'Accept acknowledgment type',
    16: 'Application acknowledgment type',
    17: 'Country',
    18: 'Character set',
  },
  EVN: { 1: 'Event type', 2: 'Date and time recorded', 6: 'Date and time it happened' },
  PID: {
    1: ['Position in list', 'e.g. 1 for the first section of this kind'],
    2: 'Patient ID (old style)',
    3: ['Patient identifiers', 'Record numbers that identify the patient'],
    4: 'Alternate patient ID',
    5: 'Patient name',
    6: "Mother's maiden name",
    7: 'Date of birth',
    8: 'Sex',
    9: 'Other names',
    10: 'Race',
    11: 'Address',
    12: 'County',
    13: 'Home phone',
    14: 'Work phone',
    15: 'Preferred language',
    16: 'Marital status',
    17: 'Religion',
    18: 'Account number',
    19: 'Social security number',
    22: 'Ethnic group',
    29: 'Date of death',
    30: 'Has died',
  },
  PV1: {
    1: ['Position in list', 'e.g. 1 for the first section of this kind'],
    2: 'Kind of visit',
    3: ['Location', 'Where the patient is, e.g. ward, room and bed'],
    4: 'Admission type',
    7: 'Attending doctor',
    8: 'Referring doctor',
    9: 'Consulting doctor',
    10: 'Hospital service',
    14: 'Admitted from',
    17: 'Admitting doctor',
    18: 'Patient type',
    19: 'Visit number',
    36: 'Discharged to',
    44: 'Admission date and time',
    45: 'Discharge date and time',
  },
  ORC: {
    1: ['What to do with the order', 'The action this message takes on the order'],
    2: ['Order number (requester)', 'The order number from the system that placed the order'],
    3: ['Order number (performer)', 'The order number from the system doing the work, e.g. the lab'],
    4: 'Order group number',
    5: 'Order status',
    9: 'Date and time of this update',
    10: 'Entered by',
    12: 'Ordering provider',
  },
  OBR: {
    1: ['Position in list', 'e.g. 1 for the first section of this kind'],
    2: ['Order number (requester)', 'The order number from the system that placed the order'],
    3: ['Order number (performer)', 'The order number from the system doing the work, e.g. the lab'],
    4: 'Test requested',
    5: ['Priority (older field)', 'How urgent the test is'],
    6: 'Requested date and time',
    7: 'Date and time collected',
    16: 'Ordering provider',
    22: 'Date and time results were reported',
    25: 'Result status',
    27: ['Timing and priority', 'When and how urgently the test should be done'],
  },
  OBX: {
    1: ['Position in list', 'e.g. 1 for the first section of this kind'],
    2: ['Kind of value', 'Whether the result is a number, text, a date, etc.'],
    3: 'What was measured',
    4: 'Sub-ID',
    5: 'Result',
    6: 'Units',
    7: 'Normal range',
    8: 'Normal or abnormal',
    11: 'Result status',
    14: 'Date and time of observation',
  },
}

export interface FieldInfo {
  name: string
  hint: string | null
}

export function fieldInfo(segmentId: string, position: number): FieldInfo {
  const entry = fieldNames[segmentId]?.[position]
  if (entry === undefined) {
    return { name: `Field ${position}`, hint: null }
  }
  return typeof entry === 'string' ? { name: entry, hint: null } : { name: entry[0], hint: entry[1] }
}

type PartNames = Record<number, string | undefined>

const coded: PartNames = { 1: 'Code', 2: 'Description', 3: 'Code system' }
const person: PartNames = { 1: 'ID', 2: 'Family name', 3: 'Given name', 4: 'Middle name or initial', 5: 'Suffix', 6: 'Prefix' }

const partNames: Record<string, PartNames | undefined> = {
  'MSH-9': { 1: 'Message code', 2: 'Trigger event', 3: 'Message structure' },
  'PID-3': { 1: 'ID number', 4: 'Issued by', 5: 'Kind of ID' },
  'PID-5': { 1: 'Family name', 2: 'Given name', 3: 'Middle name or initial', 4: 'Suffix', 5: 'Prefix' },
  'PID-11': { 1: 'Street', 2: 'Address line 2', 3: 'City', 4: 'State or province', 5: 'Postal code', 6: 'Country' },
  'PV1-3': { 1: 'Ward or unit', 2: 'Room', 3: 'Bed', 4: 'Facility' },
  'PV1-7': person,
  'PV1-8': person,
  'PV1-9': person,
  'PV1-17': person,
  'ORC-12': person,
  'OBR-16': person,
  'OBR-4': coded,
  'OBX-3': coded,
  'OBR-27': { 1: 'Quantity', 2: 'How often', 3: 'How long', 4: 'Start', 5: 'End', 6: 'Priority' },
}

type CodeTable = Record<string, string | undefined>

const resultStatus: CodeTable = {
  F: 'Final',
  P: 'Preliminary',
  C: 'Corrected',
  X: 'Could not be obtained',
  R: 'Entered, not yet verified',
  I: 'Pending',
  D: 'Deleted',
  W: 'Posted in error',
}

const priority: CodeTable = {
  S: 'Urgent – STAT, do it immediately',
  A: 'As soon as possible',
  R: 'Routine',
  P: 'Before surgery',
  C: 'Call back with results',
  T: 'Timing critical',
  PRN: 'As needed',
}

const componentCodeTables: Record<string, Record<number, CodeTable | undefined> | undefined> = {
  'OBR-27': { 6: priority },
}

export function isStatRequest(segment: Segment): boolean {
  if (segment.id !== 'OBR') {
    return false
  }
  const fieldAt = (position: number) => segment.fields.find((f) => f.position === position)
  const oldPriority = fieldAt(5)?.repetitions.some((r) => r.components[0]?.value === 'S') ?? false
  const timingPriority = fieldAt(27)?.repetitions.some((r) => r.components.find((c) => c.position === 6)?.value === 'S') ?? false
  return oldPriority || timingPriority
}

const codeTables: Record<string, CodeTable | undefined> = {
  'MSH-11': { P: 'Production', T: 'Training', D: 'Debugging' },
  'PID-8': { F: 'Female', M: 'Male', O: 'Other', U: 'Unknown', A: 'Ambiguous', N: 'Not applicable' },
  'PV1-2': {
    E: 'Emergency',
    I: 'Inpatient',
    O: 'Outpatient',
    P: 'Pre-admission',
    R: 'Recurring patient',
    B: 'Obstetrics',
    C: 'Commercial account',
    N: 'Not applicable',
    U: 'Unknown',
  },
  'ORC-1': {
    NW: 'New order',
    OK: 'Order accepted',
    CA: 'Cancel order',
    DC: 'Discontinue order',
    HD: 'Hold order',
    RE: 'Results to follow',
    SC: 'Status changed',
    XO: 'Change order',
  },
  'OBX-2': {
    NM: 'Number',
    SN: 'Number',
    ST: 'Short text',
    TX: 'Text',
    FT: 'Formatted text',
    CE: 'Coded value',
    CWE: 'Coded value',
    DT: 'Date',
    TM: 'Time',
    TS: 'Date and time',
    ED: 'Attached document',
  },
  'OBX-8': {
    N: 'Normal',
    L: 'Below normal',
    H: 'Above normal',
    LL: 'Far below normal',
    HH: 'Far above normal',
    A: 'Abnormal',
    AA: 'Very abnormal',
  },
  'OBX-11': resultStatus,
  'OBR-25': resultStatus,
  'OBR-5': priority,
}

const messageTypes: Record<string, string | undefined> = {
  'ADT^A01': 'Patient admitted',
  'ADT^A02': 'Patient transferred',
  'ADT^A03': 'Patient discharged',
  'ADT^A04': 'Patient registered',
  'ADT^A08': 'Patient details updated',
  'ORU^R01': 'Test results',
  'ORM^O01': 'Order',
  'OML^O21': 'Lab order',
  'SIU^S12': 'Appointment booked',
  ADT: 'Patient admin update',
  ORU: 'Results',
  ORM: 'Order',
  ACK: 'Acknowledgment',
}

const dateFields = new Set([
  'MSH-7',
  'EVN-2',
  'EVN-6',
  'PID-7',
  'PID-29',
  'PV1-44',
  'PV1-45',
  'ORC-9',
  'OBR-6',
  'OBR-7',
  'OBR-22',
  'OBX-14',
])

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatHl7DateTime(value: string): string | null {
  const match = /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\.\d{1,4})?([+-]\d{4})?$/.exec(value)
  if (!match) {
    return null
  }
  const [, year, month, day, hour, minute, second, fraction, zone]: (string | undefined)[] = match
  const outOfRange = (part: string | undefined, min: number, max: number) => part !== undefined && (Number(part) < min || Number(part) > max)
  if (outOfRange(month, 1, 12) || outOfRange(day, 1, 31) || outOfRange(hour, 0, 23) || outOfRange(minute, 0, 59) || outOfRange(second, 0, 59)) {
    return null
  }
  let text = month === undefined ? `${year}` : `${day === undefined ? '' : `${Number(day)} `}${months[Number(month) - 1]} ${year}`
  if (hour !== undefined) {
    text += ` at ${hour}:${minute ?? '00'}${second === undefined ? '' : `:${second}${fraction ?? ''}`}`
  }
  if (zone !== undefined) {
    text += ` (UTC${zone.slice(0, 3)}:${zone.slice(3)})`
  }
  return text
}

export interface FieldPart {
  label: string
  value: string
}

export interface FieldDescription extends FieldInfo {
  text: string | null
  entries: FieldPart[][]
}

function plainValue(value: string, field: Field): string {
  const subcomponents = field.repetitions[0]?.components[0]?.subcomponents ?? []
  return subcomponents.length > 1 ? subcomponents.map((s) => s.value).filter(Boolean).join(' / ') : value
}

export function describeField(segmentId: string, field: Field): FieldDescription {
  const key = `${segmentId}-${field.position}`
  const info = fieldInfo(segmentId, field.position)
  const none = { ...info, text: null, entries: [] }

  if (field.isEmpty) {
    return none
  }
  if (field.isNull) {
    return { ...none, text: 'Deliberately cleared' }
  }
  if (dateFields.has(key)) {
    return { ...none, text: formatHl7DateTime(field.value) ?? field.value }
  }

  const first = field.repetitions[0]?.components
  if (key === 'MSH-9' && first) {
    const code = first[0]?.value ?? ''
    const event = first[1]?.value ?? ''
    const name = messageTypes[`${code}^${event}`] ?? messageTypes[code]
    return { ...none, text: name ? `${name} (${code}${event ? `^${event}` : ''})` : field.value }
  }

  const table = codeTables[key]
  if (table) {
    const codes = field.repetitions.map((r) => r.components[0]?.value ?? '')
    const meanings = codes.map((code) => table[code])
    if (meanings.every((m) => m !== undefined)) {
      return { ...none, text: meanings.map((m, i) => `${m} (${codes[i]})`).join(', ') }
    }
  }

  const isComposite = field.repetitions.length > 1 || field.repetitions.some((r) => r.components.length > 1)
  if (!isComposite) {
    return { ...none, text: plainValue(field.value, field) }
  }

  const names = partNames[key]
  const partTables = componentCodeTables[key]
  const entries = field.repetitions
    .map((rep) =>
      rep.components
        .map((c) => {
          const meaning = partTables?.[c.position]?.[c.value]
          return {
            label: names?.[c.position] ?? `Part ${c.position}`,
            value: meaning
              ? `${meaning} (${c.value})`
              : c.subcomponents.length > 1
                ? c.subcomponents.map((s) => s.value).filter(Boolean).join(' / ')
                : c.value,
          }
        })
        .filter((part) => part.value.length > 0),
    )
    .filter((entry) => entry.length > 0)
  return { ...none, entries }
}

export interface ProblemExplanation {
  title: string
  explanation: string
  fix: string
}

export const problemExplanations: Record<Hl7ParseErrorCode, ProblemExplanation> = {
  EmptyMessage: {
    title: 'The message is empty',
    explanation: "There's nothing to check yet.",
    fix: 'Paste an HL7 message into the box, or try one of the examples.',
  },
  MissingMshSegment: {
    title: 'The message header is missing',
    explanation: "Every HL7 message must start with a header line beginning with MSH. Without it, the message can't be read.",
    fix: 'Make sure the first line starts with MSH|^~\\&|',
  },
  MshNotFirstSegment: {
    title: "The header isn't the first line",
    explanation: 'The header line (starting with MSH) must come before every other line.',
    fix: 'Move the line that starts with MSH to the very top.',
  },
  MalformedMshSegment: {
    title: 'The header line is incomplete',
    explanation: "The header line is too short to tell which characters separate the parts of the message.",
    fix: 'The header should start with MSH|^~\\&| followed by the sender and receiver details.',
  },
  InvalidEncodingCharacters: {
    title: "The header's special characters are wrong",
    explanation: 'Right after "MSH|", the header must list 4 special characters (normally ^~\\&) that split values into smaller parts. They are missing or the wrong length.',
    fix: 'Start the message with MSH|^~\\&|',
  },
  InvalidDelimiters: {
    title: "The separator characters can't be used",
    explanation: 'The characters chosen to separate parts of the message are repeated, are letters or numbers, or are spaces.',
    fix: 'Use the standard separators: MSH|^~\\&|',
  },
  DelimiterMismatch: {
    title: 'Different separators than expected',
    explanation: 'The header lists different special characters from the ones this check was set up to use.',
    fix: 'Confirm which separators the sending system uses.',
  },
  InvalidSegmentId: {
    title: 'A line has an invalid label',
    explanation: 'Every line must start with a 3-character label in capital letters, such as PID or OBX. Labels are case-sensitive.',
    fix: 'Correct the label at the start of the line, e.g. PV1 instead of pv1.',
  },
  UnsupportedSegment: {
    title: "A section this tool doesn't check in detail",
    explanation: 'The line was read correctly, but this tool only checks the main sections (header, patient, visit, order, test request and result) in detail. This is usually fine.',
    fix: "No action needed, unless the receiving system doesn't expect this section.",
  },
  MultipleMshSegments: {
    title: 'More than one message header',
    explanation: 'A second header line (starting with MSH) was found. This usually means two messages were pasted together.',
    fix: 'Check one message at a time: remove everything from the second line that starts with MSH.',
  },
}

export const severityLabels: Record<Hl7ParseErrorSeverity, string> = {
  Error: 'Needs fixing',
  Warning: 'Worth checking',
}
