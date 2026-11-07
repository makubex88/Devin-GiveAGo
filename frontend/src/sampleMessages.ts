// Synthetic, non-clinical sample messages. No real patient or clinical data.
export const validSample = [
  'MSH|^~\\&|SENDING_APP|SENDING_FAC|RECEIVING_APP|RECEIVING_FAC|20260101120000||ORU^R01^ORU_R01|MSG00001|P|2.5.1',
  'PID|1||TEST-MRN-0001^^^TEST_AUTH&0.0.0&ISO^MR~TEST-ALT-0002^^^TEST_AUTH^PI||SYNTHETIC^PATIENT^A||19000101|U|||1 TEST STREET^^TESTVILLE^TS^00000',
  'PV1|1|O|TEST_UNIT^ROOM-1^BED-1||||TEST-PROV-001^SYNTHETIC^PROVIDER',
  'ORC|RE|TEST-ORDER-0001|TEST-FILLER-0001',
  'OBR|1|TEST-ORDER-0001|TEST-FILLER-0001|TEST-CODE-1^Synthetic Test Panel^LOCAL',
  'OBX|1|NM|TEST-CODE-1A^Synthetic Observation A^LOCAL||1|units|||||F',
  'OBX|2|ST|TEST-CODE-1B^Synthetic Observation B^LOCAL||Synthetic text||||||F',
].join('\n')

export const sampleWithIssues = [
  'MSH|^~\\&|SENDING_APP|SENDING_FAC|RECEIVING_APP|RECEIVING_FAC|20260101120000||ADT^A01^ADT_A01|MSG00002|P|2.5.1',
  'EVN|A01|20260101120000',
  'PID|1||TEST-MRN-0003||SYNTHETIC^PATIENT^B||19000101|U',
  'pv1|1|I',
  'MSH|^~\\&|SENDING_APP|SENDING_FAC',
].join('\n')

export interface StoryStep {
  title: string
  text: string
  lineNumber: number | null
}

export const statSample = [
  'MSH|^~\\&|LAB_SYSTEM|EXAMPLE_LAB|ER_SYSTEM|EXAMPLE_HOSPITAL|20260101094000||ORU^R01^ORU_R01|MSG-STAT-0001|P|2.5.1',
  'PID|1||TEST-MRN-0042^^^EXAMPLE_HOSPITAL^MR||SAMPLE^SAM||19850615|U',
  'PV1|1|E|EMERGENCY^BAY-3||||TEST-DOC-001^EXAMPLE^RILEY',
  'ORC|RE|TEST-ORDER-0042|TEST-LAB-0042|||||||||TEST-DOC-001^EXAMPLE^RILEY',
  'OBR|1|TEST-ORDER-0042|TEST-LAB-0042|TEST-STAT-01^Example urgent blood test^LOCAL||20260101090500|20260101091000|||||||||TEST-DOC-001^EXAMPLE^RILEY||||||20260101094000|||F||^^^^^S',
  'OBX|1|NM|TEST-STAT-01A^Example blood marker^LOCAL||42|units|0-10|H|||F|||20260101093500',
].join('\n')

// A made-up story that walks through statSample line by line. All people, places, tests and values are fictional.
export const statStory: StoryStep[] = [
  {
    title: 'Sam arrives at the emergency department',
    text: 'At 9:00 on 1 January, Sam Sample (a made-up patient) is seen in bay 3 of the emergency department by Dr Riley Example.',
    lineNumber: 3,
  },
  {
    title: 'The doctor orders an urgent (STAT) test',
    text: 'Dr Example needs an answer fast, so at 9:05 she orders a blood test marked STAT. STAT means "do it now, ahead of routine work". A blood sample is taken at 9:10.',
    lineNumber: 5,
  },
  {
    title: 'The lab runs the test',
    text: 'The lab sees the STAT priority and runs the test straight away. The result is ready at 9:35 and is higher than the normal range.',
    lineNumber: 6,
  },
  {
    title: "The lab's system sends this message",
    text: "At 9:40 the lab's computer system sends this HL7 message to the emergency department's system, so the result appears on Sam's record.",
    lineNumber: 1,
  },
  {
    title: 'It says who the result is for',
    text: "Sam's record number and name make sure the result is filed against the right person.",
    lineNumber: 2,
  },
  {
    title: 'It matches the result to the original order',
    text: 'The order numbers are the same ones used when the test was requested, so the result can be matched to the order.',
    lineNumber: 4,
  },
  {
    title: 'Why STAT matters',
    text: 'The receiving system uses the STAT priority to put this result at the top of the doctor\'s list. If the priority were missing or wrong, an urgent result could wait in the routine queue.',
    lineNumber: null,
  },
]
