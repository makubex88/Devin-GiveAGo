namespace HL7Sentinel.Core.Models;

/// <summary>Segment types explicitly supported by the parser.</summary>
public enum Hl7SegmentType
{
    Unsupported = 0,
    MSH,
    PID,
    PV1,
    ORC,
    OBR,
    OBX,
}
