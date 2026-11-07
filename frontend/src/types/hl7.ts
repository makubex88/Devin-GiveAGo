export type Hl7SegmentType = 'Unsupported' | 'MSH' | 'PID' | 'PV1' | 'ORC' | 'OBR' | 'OBX'

export type Hl7ParseErrorSeverity = 'Warning' | 'Error'

export type Hl7ParseErrorCode =
  | 'EmptyMessage'
  | 'MissingMshSegment'
  | 'MshNotFirstSegment'
  | 'MalformedMshSegment'
  | 'InvalidEncodingCharacters'
  | 'InvalidDelimiters'
  | 'DelimiterMismatch'
  | 'InvalidSegmentId'
  | 'UnsupportedSegment'
  | 'MultipleMshSegments'

export interface Subcomponent {
  position: number
  value: string
}

export interface Component {
  position: number
  value: string
  subcomponents: Subcomponent[]
}

export interface Repetition {
  index: number
  value: string
  components: Component[]
}

export interface Field {
  position: number
  value: string
  isEmpty: boolean
  isNull: boolean
  repetitions: Repetition[]
}

export interface Segment {
  index: number
  lineNumber: number
  id: string
  segmentType: Hl7SegmentType
  isSupported: boolean
  value: string
  fields: Field[]
}

export interface Delimiters {
  fieldSeparator: string
  componentSeparator: string
  repetitionSeparator: string
  escapeCharacter: string
  subcomponentSeparator: string
  truncationCharacter: string | null
  encodingCharacters: string
}

export interface ParseError {
  code: Hl7ParseErrorCode
  severity: Hl7ParseErrorSeverity
  message: string
  lineNumber: number | null
  segmentId: string | null
  fieldPosition: number | null
}

export interface ParseResponse {
  isSuccess: boolean
  delimiters: Delimiters | null
  segments: Segment[]
  errors: ParseError[]
}
