namespace HL7Sentinel.Core.Tests;

/// <summary>Synthetic, non-clinical HL7 fixtures. No real patient or clinical data.</summary>
internal static class SyntheticMessages
{
    public const string MshLine =
        @"MSH|^~\&|SENDING_APP|SENDING_FAC|RECEIVING_APP|RECEIVING_FAC|20260101120000||ORU^R01^ORU_R01|MSG00001|P|2.5.1";

    public const string PidLine =
        @"PID|1||TEST-MRN-0001^^^TEST_AUTH&0.0.0&ISO^MR~TEST-ALT-0002^^^TEST_AUTH^PI||SYNTHETIC^PATIENT^A||19000101|U|||1 TEST STREET^^TESTVILLE^TS^00000";

    public const string Pv1Line =
        @"PV1|1|O|TEST_UNIT^ROOM-1^BED-1||||TEST-PROV-001^SYNTHETIC^PROVIDER";

    public const string OrcLine =
        @"ORC|RE|TEST-ORDER-0001|TEST-FILLER-0001";

    public const string ObrLine =
        @"OBR|1|TEST-ORDER-0001|TEST-FILLER-0001|TEST-CODE-1^Synthetic Test Panel^LOCAL";

    public const string ObxLine1 =
        @"OBX|1|NM|TEST-CODE-1A^Synthetic Observation A^LOCAL||1|units|||||F";

    public const string ObxLine2 =
        @"OBX|2|ST|TEST-CODE-1B^Synthetic Observation B^LOCAL||Synthetic text||||||F";

    public static readonly string[] OruLines = { MshLine, PidLine, Pv1Line, OrcLine, ObrLine, ObxLine1, ObxLine2 };

    public static string Oru(string terminator = "\r") => string.Join(terminator, OruLines);
}
