namespace HL7Sentinel.Core.Models;

/// <summary>A component of a field repetition. <see cref="Position"/> is 1-based.</summary>
public sealed class Hl7Component
{
    public Hl7Component(int position, string value, IReadOnlyList<Hl7Subcomponent> subcomponents)
    {
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(subcomponents);
        Position = position;
        Value = value;
        Subcomponents = subcomponents;
    }

    public int Position { get; }

    /// <summary>Raw component text, including any subcomponent separators and escape sequences.</summary>
    public string Value { get; }

    public IReadOnlyList<Hl7Subcomponent> Subcomponents { get; }

    public bool IsEmpty => Value.Length == 0;

    /// <summary>Returns the subcomponent at the 1-based <paramref name="position"/>, or <c>null</c> when absent.</summary>
    public Hl7Subcomponent? GetSubcomponent(int position) =>
        position >= 1 && position <= Subcomponents.Count ? Subcomponents[position - 1] : null;
}
