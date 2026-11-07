namespace HL7Sentinel.Core.Models;

/// <summary>
/// The delimiter set used to encode an HL7 v2 ER7 message. Declared in MSH-1 (field separator)
/// and MSH-2 (component, repetition, escape, subcomponent and optional v2.7+ truncation characters).
/// </summary>
public sealed record Hl7Delimiters
{
    public const char DefaultFieldSeparator = '|';
    public const char DefaultComponentSeparator = '^';
    public const char DefaultRepetitionSeparator = '~';
    public const char DefaultEscapeCharacter = '\\';
    public const char DefaultSubcomponentSeparator = '&';

    public static Hl7Delimiters Default { get; } = new(
        DefaultFieldSeparator,
        DefaultComponentSeparator,
        DefaultRepetitionSeparator,
        DefaultEscapeCharacter,
        DefaultSubcomponentSeparator);

    public Hl7Delimiters(
        char fieldSeparator,
        char componentSeparator,
        char repetitionSeparator,
        char escapeCharacter,
        char subcomponentSeparator,
        char? truncationCharacter = null)
    {
        FieldSeparator = fieldSeparator;
        ComponentSeparator = componentSeparator;
        RepetitionSeparator = repetitionSeparator;
        EscapeCharacter = escapeCharacter;
        SubcomponentSeparator = subcomponentSeparator;
        TruncationCharacter = truncationCharacter;
    }

    public char FieldSeparator { get; }

    public char ComponentSeparator { get; }

    public char RepetitionSeparator { get; }

    public char EscapeCharacter { get; }

    public char SubcomponentSeparator { get; }

    /// <summary>Optional truncation character introduced in HL7 v2.7 (typically '#').</summary>
    public char? TruncationCharacter { get; }

    /// <summary>The MSH-2 representation of these delimiters.</summary>
    public string EncodingCharacters => TruncationCharacter is { } truncation
        ? string.Concat(ComponentSeparator, RepetitionSeparator, EscapeCharacter, SubcomponentSeparator, truncation)
        : string.Concat(ComponentSeparator, RepetitionSeparator, EscapeCharacter, SubcomponentSeparator);

    /// <summary>
    /// Builds a delimiter set from an MSH-1 field separator and MSH-2 encoding characters.
    /// Returns <c>null</c> when <paramref name="encodingCharacters"/> is not 4 or 5 characters long.
    /// </summary>
    public static Hl7Delimiters? FromEncodingCharacters(char fieldSeparator, string encodingCharacters)
    {
        ArgumentNullException.ThrowIfNull(encodingCharacters);

        if (encodingCharacters.Length is not (4 or 5))
        {
            return null;
        }

        return new Hl7Delimiters(
            fieldSeparator,
            encodingCharacters[0],
            encodingCharacters[1],
            encodingCharacters[2],
            encodingCharacters[3],
            encodingCharacters.Length == 5 ? encodingCharacters[4] : null);
    }

    /// <summary>
    /// Returns a description of every problem with this delimiter set; empty when valid.
    /// Delimiters must be distinct and must not be letters, digits, whitespace or segment terminators.
    /// </summary>
    public IReadOnlyList<string> Validate()
    {
        var problems = new List<string>();
        var named = new List<(string Name, char Value)>
        {
            ("field separator", FieldSeparator),
            ("component separator", ComponentSeparator),
            ("repetition separator", RepetitionSeparator),
            ("escape character", EscapeCharacter),
            ("subcomponent separator", SubcomponentSeparator),
        };

        if (TruncationCharacter is { } truncation)
        {
            named.Add(("truncation character", truncation));
        }

        foreach (var (name, value) in named)
        {
            if (char.IsLetterOrDigit(value) || char.IsWhiteSpace(value) || char.IsControl(value))
            {
                problems.Add($"The {name} '{Printable(value)}' must not be a letter, digit, whitespace or control character.");
            }
        }

        for (var i = 0; i < named.Count; i++)
        {
            for (var j = i + 1; j < named.Count; j++)
            {
                if (named[i].Value == named[j].Value)
                {
                    problems.Add($"The {named[i].Name} and {named[j].Name} are both '{Printable(named[i].Value)}'; delimiters must be distinct.");
                }
            }
        }

        return problems.AsReadOnly();
    }

    private static string Printable(char value) => char.IsControl(value) ? $"\\u{(int)value:X4}" : value.ToString();
}
