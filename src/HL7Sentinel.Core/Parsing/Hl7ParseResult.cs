using HL7Sentinel.Core.Models;

namespace HL7Sentinel.Core.Parsing;

/// <summary>
/// The outcome of parsing. <see cref="Message"/> is <c>null</c> only when the input could not be
/// parsed at all (e.g. empty input or undeterminable delimiters).
/// </summary>
public sealed class Hl7ParseResult
{
    public Hl7ParseResult(Hl7Message? message, IReadOnlyList<Hl7ParseError> errors)
    {
        ArgumentNullException.ThrowIfNull(errors);
        Message = message;
        Errors = errors;
    }

    public Hl7Message? Message { get; }

    /// <summary>All diagnostics (errors and warnings) in deterministic order.</summary>
    public IReadOnlyList<Hl7ParseError> Errors { get; }

    public bool HasErrors => Errors.Any(e => e.Severity == Hl7ParseErrorSeverity.Error);

    /// <summary>True when a message was produced and no diagnostics of severity <see cref="Hl7ParseErrorSeverity.Error"/> were raised.</summary>
    public bool IsSuccess => Message is not null && !HasErrors;
}
