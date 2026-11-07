namespace HL7Sentinel.Core.Models;

/// <summary>One occurrence of a repeating field. <see cref="Index"/> is 1-based.</summary>
public sealed class Hl7Repetition
{
    public Hl7Repetition(int index, string value, IReadOnlyList<Hl7Component> components)
    {
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(components);
        Index = index;
        Value = value;
        Components = components;
    }

    public int Index { get; }

    /// <summary>Raw repetition text, including any component/subcomponent separators and escape sequences.</summary>
    public string Value { get; }

    public IReadOnlyList<Hl7Component> Components { get; }

    public bool IsEmpty => Value.Length == 0;

    /// <summary>Returns the component at the 1-based <paramref name="position"/>, or <c>null</c> when absent.</summary>
    public Hl7Component? GetComponent(int position) =>
        position >= 1 && position <= Components.Count ? Components[position - 1] : null;
}
