using HL7Sentinel.Core.Models;

namespace HL7Sentinel.Core.Parsing;

public sealed record Hl7ParserOptions
{
    public static Hl7ParserOptions Default { get; } = new();

    /// <summary>
    /// Delimiters to parse with. When <c>null</c> (the default) they are read from MSH-1 and MSH-2.
    /// When set, the MSH header is checked against them and differences are reported as
    /// <see cref="Hl7ParseErrorCode.DelimiterMismatch"/>.
    /// </summary>
    public Hl7Delimiters? Delimiters { get; init; }

    /// <summary>
    /// Whether a missing MSH segment is reported as an error when <see cref="Delimiters"/> is configured.
    /// Without configured delimiters an MSH segment is always required.
    /// </summary>
    public bool RequireMshSegment { get; init; } = true;

    /// <summary>
    /// Whether LF and CRLF are accepted as segment terminators in addition to the standard CR.
    /// </summary>
    public bool AllowLineFeedTerminators { get; init; } = true;
}
