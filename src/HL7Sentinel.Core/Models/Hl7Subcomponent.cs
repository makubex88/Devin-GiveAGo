namespace HL7Sentinel.Core.Models;

/// <summary>A subcomponent of a component. <see cref="Position"/> is 1-based.</summary>
public sealed record Hl7Subcomponent(int Position, string Value)
{
    public bool IsEmpty => Value.Length == 0;
}
