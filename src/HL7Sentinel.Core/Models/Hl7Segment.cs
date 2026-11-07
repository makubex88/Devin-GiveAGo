namespace HL7Sentinel.Core.Models;

/// <summary>
/// A parsed segment. <see cref="Fields"/> is ordered by HL7 field position starting at 1,
/// so <c>Fields[n - 1].Position == n</c>. For MSH, field 1 is the field separator and
/// field 2 is the raw encoding characters.
/// </summary>
public sealed class Hl7Segment
{
    public Hl7Segment(
        string id,
        Hl7SegmentType segmentType,
        int index,
        int lineNumber,
        string value,
        IReadOnlyList<Hl7Field> fields)
    {
        ArgumentNullException.ThrowIfNull(id);
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(fields);
        Id = id;
        SegmentType = segmentType;
        Index = index;
        LineNumber = lineNumber;
        Value = value;
        Fields = fields;
    }

    /// <summary>The segment identifier, e.g. <c>PID</c>.</summary>
    public string Id { get; }

    public Hl7SegmentType SegmentType { get; }

    public bool IsSupported => SegmentType != Hl7SegmentType.Unsupported;

    /// <summary>0-based index of this segment within <see cref="Hl7Message.Segments"/>.</summary>
    public int Index { get; }

    /// <summary>1-based line number of the segment in the original input.</summary>
    public int LineNumber { get; }

    /// <summary>Raw segment text without its terminator.</summary>
    public string Value { get; }

    public IReadOnlyList<Hl7Field> Fields { get; }

    /// <summary>Returns the field at the HL7 <paramref name="position"/>, or <c>null</c> when absent.</summary>
    public Hl7Field? GetField(int position) =>
        position >= 1 && position <= Fields.Count ? Fields[position - 1] : null;
}
