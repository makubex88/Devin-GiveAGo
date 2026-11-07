namespace HL7Sentinel.Core.Models;

/// <summary>A parsed HL7 v2 ER7 message.</summary>
public sealed class Hl7Message
{
    public Hl7Message(Hl7Delimiters delimiters, IReadOnlyList<Hl7Segment> segments)
    {
        ArgumentNullException.ThrowIfNull(delimiters);
        ArgumentNullException.ThrowIfNull(segments);
        Delimiters = delimiters;
        Segments = segments;
    }

    /// <summary>The delimiters used to parse the message.</summary>
    public Hl7Delimiters Delimiters { get; }

    public IReadOnlyList<Hl7Segment> Segments { get; }

    /// <summary>The first MSH segment, or <c>null</c> when absent.</summary>
    public Hl7Segment? Header => GetFirstSegment("MSH");

    /// <summary>Returns all segments with the given identifier, in message order.</summary>
    public IReadOnlyList<Hl7Segment> GetSegments(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        return Segments.Where(s => string.Equals(s.Id, id, StringComparison.Ordinal)).ToList().AsReadOnly();
    }

    /// <summary>Returns the first segment with the given identifier, or <c>null</c> when absent.</summary>
    public Hl7Segment? GetFirstSegment(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        return Segments.FirstOrDefault(s => string.Equals(s.Id, id, StringComparison.Ordinal));
    }
}
