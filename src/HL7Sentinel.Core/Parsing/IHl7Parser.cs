namespace HL7Sentinel.Core.Parsing;

public interface IHl7Parser
{
    /// <summary>Parses an HL7 v2 ER7 message. Malformed input is reported via <see cref="Hl7ParseResult.Errors"/>, not exceptions.</summary>
    Hl7ParseResult Parse(string message);
}
