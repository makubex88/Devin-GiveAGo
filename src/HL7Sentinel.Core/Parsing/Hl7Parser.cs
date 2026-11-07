using HL7Sentinel.Core.Models;

namespace HL7Sentinel.Core.Parsing;

/// <summary>
/// Deterministic HL7 v2 ER7 (pipe-delimited) parser. Preserves empty fields, repetitions, components,
/// subcomponents and HL7 field positions. Escape sequences are kept verbatim.
/// </summary>
public sealed class Hl7Parser : IHl7Parser
{
    private const string MshSegmentId = "MSH";

    private static readonly IReadOnlyDictionary<string, Hl7SegmentType> SupportedSegments =
        new Dictionary<string, Hl7SegmentType>(StringComparer.Ordinal)
        {
            ["MSH"] = Hl7SegmentType.MSH,
            ["PID"] = Hl7SegmentType.PID,
            ["PV1"] = Hl7SegmentType.PV1,
            ["ORC"] = Hl7SegmentType.ORC,
            ["OBR"] = Hl7SegmentType.OBR,
            ["OBX"] = Hl7SegmentType.OBX,
        };

    private readonly Hl7ParserOptions _options;

    public Hl7Parser()
        : this(Hl7ParserOptions.Default)
    {
    }

    public Hl7Parser(Hl7ParserOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        _options = options;
    }

    public Hl7ParseResult Parse(string message)
    {
        ArgumentNullException.ThrowIfNull(message);

        var errors = new List<Hl7ParseError>();
        var lines = SplitSegments(message);

        if (lines.Count == 0)
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.EmptyMessage,
                Hl7ParseErrorSeverity.Error,
                "The message is empty."));
            return Result(null, errors);
        }

        var header = lines.FirstOrDefault(IsMshLine);

        var delimiters = _options.Delimiters is { } configured
            ? ResolveConfiguredDelimiters(configured, header, errors)
            : ResolveHeaderDelimiters(header, errors);

        if (delimiters is null)
        {
            return Result(null, errors);
        }

        if (header is not null && header != lines[0])
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.MshNotFirstSegment,
                Hl7ParseErrorSeverity.Error,
                $"The MSH segment must be the first segment but was found on line {header.LineNumber}.",
                header.LineNumber,
                MshSegmentId));
        }

        var segments = new List<Hl7Segment>(lines.Count);
        foreach (var line in lines)
        {
            segments.Add(ParseSegment(line, segments.Count, delimiters, line == header, errors));
        }

        return Result(new Hl7Message(delimiters, segments.AsReadOnly()), errors);
    }

    private static Hl7ParseResult Result(Hl7Message? message, List<Hl7ParseError> errors) =>
        new(message, errors.AsReadOnly());

    private List<SourceLine> SplitSegments(string message)
    {
        var lines = new List<SourceLine>();
        var lineNumber = 1;
        var start = 0;

        for (var i = 0; i < message.Length; i++)
        {
            var c = message[i];
            var isTerminator = c == '\r' || (c == '\n' && _options.AllowLineFeedTerminators);
            if (!isTerminator)
            {
                continue;
            }

            AddLine(lines, message[start..i], lineNumber);

            if (c == '\r' && _options.AllowLineFeedTerminators && i + 1 < message.Length && message[i + 1] == '\n')
            {
                i++;
            }

            start = i + 1;
            lineNumber++;
        }

        AddLine(lines, message[start..], lineNumber);
        return lines;
    }

    private static void AddLine(List<SourceLine> lines, string text, int lineNumber)
    {
        if (!string.IsNullOrWhiteSpace(text))
        {
            lines.Add(new SourceLine(lineNumber, text));
        }
    }

    private static bool IsMshLine(SourceLine line) =>
        line.Text.StartsWith(MshSegmentId, StringComparison.Ordinal)
        && (line.Text.Length == MshSegmentId.Length || !char.IsLetterOrDigit(line.Text[MshSegmentId.Length]));

    private static string DeclaredEncodingCharacters(string mshText, char fieldSeparator)
    {
        const int start = 4;
        if (mshText.Length <= start)
        {
            return string.Empty;
        }

        var end = mshText.IndexOf(fieldSeparator, start);
        return end < 0 ? mshText[start..] : mshText[start..end];
    }

    private static Hl7Delimiters? ResolveHeaderDelimiters(SourceLine? header, List<Hl7ParseError> errors)
    {
        if (header is null)
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.MissingMshSegment,
                Hl7ParseErrorSeverity.Error,
                "No MSH segment was found; delimiters cannot be determined."));
            return null;
        }

        if (header.Text.Length <= MshSegmentId.Length)
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.MalformedMshSegment,
                Hl7ParseErrorSeverity.Error,
                "The MSH segment does not declare a field separator (MSH-1).",
                header.LineNumber,
                MshSegmentId,
                1));
            return null;
        }

        var fieldSeparator = header.Text[MshSegmentId.Length];
        var encodingCharacters = DeclaredEncodingCharacters(header.Text, fieldSeparator);
        var delimiters = Hl7Delimiters.FromEncodingCharacters(fieldSeparator, encodingCharacters);

        if (delimiters is null)
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.InvalidEncodingCharacters,
                Hl7ParseErrorSeverity.Error,
                $"MSH-2 must contain 4 or 5 encoding characters but contained {encodingCharacters.Length} ('{encodingCharacters}').",
                header.LineNumber,
                MshSegmentId,
                2));
            return null;
        }

        var problems = delimiters.Validate();
        foreach (var problem in problems)
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.InvalidDelimiters,
                Hl7ParseErrorSeverity.Error,
                problem,
                header.LineNumber,
                MshSegmentId,
                2));
        }

        return problems.Count == 0 ? delimiters : null;
    }

    private Hl7Delimiters? ResolveConfiguredDelimiters(
        Hl7Delimiters configured,
        SourceLine? header,
        List<Hl7ParseError> errors)
    {
        var problems = configured.Validate();
        if (problems.Count > 0)
        {
            foreach (var problem in problems)
            {
                errors.Add(new Hl7ParseError(
                    Hl7ParseErrorCode.InvalidDelimiters,
                    Hl7ParseErrorSeverity.Error,
                    $"Configured delimiters are invalid: {problem}"));
            }

            return null;
        }

        if (header is null)
        {
            if (_options.RequireMshSegment)
            {
                errors.Add(new Hl7ParseError(
                    Hl7ParseErrorCode.MissingMshSegment,
                    Hl7ParseErrorSeverity.Error,
                    "No MSH segment was found."));
            }

            return configured;
        }

        if (header.Text.Length > MshSegmentId.Length && header.Text[MshSegmentId.Length] == configured.FieldSeparator)
        {
            var declared = DeclaredEncodingCharacters(header.Text, configured.FieldSeparator);
            if (!string.Equals(declared, configured.EncodingCharacters, StringComparison.Ordinal))
            {
                errors.Add(new Hl7ParseError(
                    Hl7ParseErrorCode.DelimiterMismatch,
                    Hl7ParseErrorSeverity.Warning,
                    $"MSH-2 declares encoding characters '{declared}' but the configured encoding characters '{configured.EncodingCharacters}' were used.",
                    header.LineNumber,
                    MshSegmentId,
                    2));
            }
        }

        return configured;
    }

    private static Hl7Segment ParseSegment(
        SourceLine line,
        int index,
        Hl7Delimiters delimiters,
        bool isHeader,
        List<Hl7ParseError> errors)
    {
        if (IsMshLine(line))
        {
            return ParseMshSegment(line, index, delimiters, isHeader, errors);
        }

        var parts = line.Text.Split(delimiters.FieldSeparator);
        var id = parts[0];
        var fields = new List<Hl7Field>(parts.Length - 1);
        for (var i = 1; i < parts.Length; i++)
        {
            fields.Add(ParseField(i, parts[i], delimiters));
        }

        var segmentType = ResolveSegmentType(id, line.LineNumber, errors);
        return new Hl7Segment(id, segmentType, index, line.LineNumber, line.Text, fields.AsReadOnly());
    }

    private static Hl7Segment ParseMshSegment(
        SourceLine line,
        int index,
        Hl7Delimiters delimiters,
        bool isHeader,
        List<Hl7ParseError> errors)
    {
        if (!isHeader)
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.MultipleMshSegments,
                Hl7ParseErrorSeverity.Warning,
                $"An additional MSH segment was found on line {line.LineNumber}; batch messages are parsed as a single message.",
                line.LineNumber,
                MshSegmentId));
        }

        var fields = new List<Hl7Field>();
        var text = line.Text;

        if (text.Length <= MshSegmentId.Length)
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.MalformedMshSegment,
                Hl7ParseErrorSeverity.Error,
                "The MSH segment does not declare a field separator (MSH-1).",
                line.LineNumber,
                MshSegmentId,
                1));
            return new Hl7Segment(MshSegmentId, Hl7SegmentType.MSH, index, line.LineNumber, text, fields.AsReadOnly());
        }

        // MSH-1 is the field separator character itself and MSH-2 holds the encoding characters;
        // neither is split, so field numbering for the rest of MSH is offset by one.
        var declaredSeparator = text[MshSegmentId.Length];
        if (declaredSeparator != delimiters.FieldSeparator)
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.DelimiterMismatch,
                Hl7ParseErrorSeverity.Error,
                $"MSH-1 declares field separator '{declaredSeparator}' but '{delimiters.FieldSeparator}' was used.",
                line.LineNumber,
                MshSegmentId,
                1));
        }

        fields.Add(LiteralField(1, declaredSeparator.ToString()));

        var parts = text[(MshSegmentId.Length + 1)..].Split(delimiters.FieldSeparator);
        fields.Add(LiteralField(2, parts[0]));
        for (var i = 1; i < parts.Length; i++)
        {
            fields.Add(ParseField(i + 2, parts[i], delimiters));
        }

        return new Hl7Segment(MshSegmentId, Hl7SegmentType.MSH, index, line.LineNumber, text, fields.AsReadOnly());
    }

    private static Hl7SegmentType ResolveSegmentType(string id, int lineNumber, List<Hl7ParseError> errors)
    {
        if (!IsValidSegmentId(id))
        {
            errors.Add(new Hl7ParseError(
                Hl7ParseErrorCode.InvalidSegmentId,
                Hl7ParseErrorSeverity.Error,
                $"'{id}' is not a valid segment identifier; expected three uppercase letters or digits starting with a letter.",
                lineNumber,
                id));
            return Hl7SegmentType.Unsupported;
        }

        if (SupportedSegments.TryGetValue(id, out var segmentType))
        {
            return segmentType;
        }

        errors.Add(new Hl7ParseError(
            Hl7ParseErrorCode.UnsupportedSegment,
            Hl7ParseErrorSeverity.Warning,
            $"Segment '{id}' is not a supported segment type; it was parsed generically.",
            lineNumber,
            id));
        return Hl7SegmentType.Unsupported;
    }

    private static bool IsValidSegmentId(string id) =>
        id.Length == 3
        && IsUpperAsciiLetter(id[0])
        && (IsUpperAsciiLetter(id[1]) || char.IsAsciiDigit(id[1]))
        && (IsUpperAsciiLetter(id[2]) || char.IsAsciiDigit(id[2]));

    private static bool IsUpperAsciiLetter(char c) => c is >= 'A' and <= 'Z';

    private static Hl7Field LiteralField(int position, string value) =>
        new(position, value, new[]
        {
            new Hl7Repetition(1, value, new[]
            {
                new Hl7Component(1, value, new[] { new Hl7Subcomponent(1, value) }),
            }),
        });

    private static Hl7Field ParseField(int position, string value, Hl7Delimiters delimiters)
    {
        var rawRepetitions = value.Split(delimiters.RepetitionSeparator);
        var repetitions = new Hl7Repetition[rawRepetitions.Length];
        for (var r = 0; r < rawRepetitions.Length; r++)
        {
            repetitions[r] = ParseRepetition(r + 1, rawRepetitions[r], delimiters);
        }

        return new Hl7Field(position, value, Array.AsReadOnly(repetitions));
    }

    private static Hl7Repetition ParseRepetition(int index, string value, Hl7Delimiters delimiters)
    {
        var rawComponents = value.Split(delimiters.ComponentSeparator);
        var components = new Hl7Component[rawComponents.Length];
        for (var c = 0; c < rawComponents.Length; c++)
        {
            var rawSubcomponents = rawComponents[c].Split(delimiters.SubcomponentSeparator);
            var subcomponents = new Hl7Subcomponent[rawSubcomponents.Length];
            for (var s = 0; s < rawSubcomponents.Length; s++)
            {
                subcomponents[s] = new Hl7Subcomponent(s + 1, rawSubcomponents[s]);
            }

            components[c] = new Hl7Component(c + 1, rawComponents[c], Array.AsReadOnly(subcomponents));
        }

        return new Hl7Repetition(index, value, Array.AsReadOnly(components));
    }

    private sealed record SourceLine(int LineNumber, string Text);
}
