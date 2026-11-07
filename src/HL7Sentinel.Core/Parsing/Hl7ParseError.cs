namespace HL7Sentinel.Core.Parsing;

/// <summary>A structured parsing diagnostic. Location properties are <c>null</c> when not applicable.</summary>
/// <param name="LineNumber">1-based line number in the original input.</param>
/// <param name="FieldPosition">HL7 field position within the segment (e.g. 2 for MSH-2).</param>
public sealed record Hl7ParseError(
    Hl7ParseErrorCode Code,
    Hl7ParseErrorSeverity Severity,
    string Message,
    int? LineNumber = null,
    string? SegmentId = null,
    int? FieldPosition = null);
