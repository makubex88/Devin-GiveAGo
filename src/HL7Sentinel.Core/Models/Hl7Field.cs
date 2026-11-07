namespace HL7Sentinel.Core.Models;

/// <summary>
/// A field within a segment. <see cref="Position"/> is the HL7 field number (e.g. 5 for PID-5).
/// Empty fields are preserved so positions always match the source message.
/// </summary>
public sealed class Hl7Field
{
    /// <summary>The HL7 explicit null value (two double quotes).</summary>
    public const string NullValue = "\"\"";

    public Hl7Field(int position, string value, IReadOnlyList<Hl7Repetition> repetitions)
    {
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(repetitions);
        Position = position;
        Value = value;
        Repetitions = repetitions;
    }

    public int Position { get; }

    /// <summary>Raw field text exactly as it appeared in the message (escape sequences are not decoded).</summary>
    public string Value { get; }

    public IReadOnlyList<Hl7Repetition> Repetitions { get; }

    /// <summary>True when the field is present but has no content (e.g. <c>||</c>).</summary>
    public bool IsEmpty => Value.Length == 0;

    /// <summary>True when the field holds the HL7 explicit null <c>""</c>.</summary>
    public bool IsNull => Value == NullValue;

    /// <summary>Returns the repetition at the 1-based <paramref name="index"/>, or <c>null</c> when absent.</summary>
    public Hl7Repetition? GetRepetition(int index) =>
        index >= 1 && index <= Repetitions.Count ? Repetitions[index - 1] : null;

    /// <summary>
    /// Returns the raw value at the given 1-based component/subcomponent/repetition,
    /// or an empty string when that location does not exist.
    /// </summary>
    public string GetValue(int component = 1, int subcomponent = 1, int repetition = 1) =>
        GetRepetition(repetition)?.GetComponent(component)?.GetSubcomponent(subcomponent)?.Value ?? string.Empty;
}
