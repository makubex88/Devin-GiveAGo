using HL7Sentinel.Core.Models;
using HL7Sentinel.Core.Parsing;

namespace HL7Sentinel.Api.Contracts;

public sealed record ParseResponse(
    bool IsSuccess,
    DelimitersResponse? Delimiters,
    IReadOnlyList<SegmentResponse> Segments,
    IReadOnlyList<ParseErrorResponse> Errors)
{
    public static ParseResponse From(Hl7ParseResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        var message = result.Message;
        return new ParseResponse(
            result.IsSuccess,
            message is null ? null : DelimitersResponse.From(message.Delimiters),
            message?.Segments.Select(SegmentResponse.From).ToList() ?? new List<SegmentResponse>(),
            result.Errors.Select(ParseErrorResponse.From).ToList());
    }
}

public sealed record DelimitersResponse(
    string FieldSeparator,
    string ComponentSeparator,
    string RepetitionSeparator,
    string EscapeCharacter,
    string SubcomponentSeparator,
    string? TruncationCharacter,
    string EncodingCharacters)
{
    public static DelimitersResponse From(Hl7Delimiters d) => new(
        d.FieldSeparator.ToString(),
        d.ComponentSeparator.ToString(),
        d.RepetitionSeparator.ToString(),
        d.EscapeCharacter.ToString(),
        d.SubcomponentSeparator.ToString(),
        d.TruncationCharacter?.ToString(),
        d.EncodingCharacters);
}

public sealed record SegmentResponse(
    int Index,
    int LineNumber,
    string Id,
    Hl7SegmentType SegmentType,
    bool IsSupported,
    string Value,
    IReadOnlyList<FieldResponse> Fields)
{
    public static SegmentResponse From(Hl7Segment s) => new(
        s.Index,
        s.LineNumber,
        s.Id,
        s.SegmentType,
        s.IsSupported,
        s.Value,
        s.Fields.Select(FieldResponse.From).ToList());
}

public sealed record FieldResponse(
    int Position,
    string Value,
    bool IsEmpty,
    bool IsNull,
    IReadOnlyList<RepetitionResponse> Repetitions)
{
    public static FieldResponse From(Hl7Field f) => new(
        f.Position,
        f.Value,
        f.IsEmpty,
        f.IsNull,
        f.Repetitions.Select(RepetitionResponse.From).ToList());
}

public sealed record RepetitionResponse(int Index, string Value, IReadOnlyList<ComponentResponse> Components)
{
    public static RepetitionResponse From(Hl7Repetition r) =>
        new(r.Index, r.Value, r.Components.Select(ComponentResponse.From).ToList());
}

public sealed record ComponentResponse(int Position, string Value, IReadOnlyList<SubcomponentResponse> Subcomponents)
{
    public static ComponentResponse From(Hl7Component c) =>
        new(c.Position, c.Value, c.Subcomponents.Select(s => new SubcomponentResponse(s.Position, s.Value)).ToList());
}

public sealed record SubcomponentResponse(int Position, string Value);

public sealed record ParseErrorResponse(
    Hl7ParseErrorCode Code,
    Hl7ParseErrorSeverity Severity,
    string Message,
    int? LineNumber,
    string? SegmentId,
    int? FieldPosition)
{
    public static ParseErrorResponse From(Hl7ParseError e) =>
        new(e.Code, e.Severity, e.Message, e.LineNumber, e.SegmentId, e.FieldPosition);
}
