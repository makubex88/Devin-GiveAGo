namespace HL7Sentinel.Core.Parsing;

public enum Hl7ParseErrorCode
{
    /// <summary>The input is empty or contains only whitespace.</summary>
    EmptyMessage,

    /// <summary>No MSH segment was found.</summary>
    MissingMshSegment,

    /// <summary>The MSH segment is not the first segment in the message.</summary>
    MshNotFirstSegment,

    /// <summary>The MSH segment is too short to declare its delimiters.</summary>
    MalformedMshSegment,

    /// <summary>MSH-2 does not contain 4 or 5 encoding characters.</summary>
    InvalidEncodingCharacters,

    /// <summary>The delimiter set is invalid (duplicate, alphanumeric, whitespace or control characters).</summary>
    InvalidDelimiters,

    /// <summary>The delimiters declared in MSH differ from the configured delimiters.</summary>
    DelimiterMismatch,

    /// <summary>A segment identifier is not three uppercase letters/digits starting with a letter.</summary>
    InvalidSegmentId,

    /// <summary>The segment is not one of the explicitly supported segment types. It is still parsed generically.</summary>
    UnsupportedSegment,

    /// <summary>More than one MSH segment was found.</summary>
    MultipleMshSegments,
}
