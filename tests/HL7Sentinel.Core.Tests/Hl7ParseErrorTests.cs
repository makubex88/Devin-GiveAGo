using HL7Sentinel.Core.Models;
using HL7Sentinel.Core.Parsing;

namespace HL7Sentinel.Core.Tests;

public class Hl7ParseErrorTests
{
    private static Hl7ParseResult Parse(string message) => new Hl7Parser().Parse(message);

    [Fact]
    public void Parse_NullInput_Throws()
    {
        Assert.Throws<ArgumentNullException>(() => new Hl7Parser().Parse(null!));
    }

    [Fact]
    public void Constructor_NullOptions_Throws()
    {
        Assert.Throws<ArgumentNullException>(() => new Hl7Parser(null!));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\r\n\r\n")]
    public void Parse_EmptyInput_ReturnsEmptyMessageError(string input)
    {
        var result = Parse(input);

        Assert.False(result.IsSuccess);
        Assert.Null(result.Message);
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.EmptyMessage, error.Code);
        Assert.Equal(Hl7ParseErrorSeverity.Error, error.Severity);
    }

    [Fact]
    public void Parse_WithoutMsh_ReturnsMissingMshError()
    {
        var result = Parse(SyntheticMessages.PidLine + "\r" + SyntheticMessages.Pv1Line);

        Assert.Null(result.Message);
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.MissingMshSegment, error.Code);
    }

    [Fact]
    public void Parse_MshNotFirst_ReportsErrorButStillParses()
    {
        var result = Parse(SyntheticMessages.PidLine + "\r" + SyntheticMessages.MshLine);

        Assert.False(result.IsSuccess);
        Assert.NotNull(result.Message);
        Assert.Equal(new[] { "PID", "MSH" }, result.Message!.Segments.Select(s => s.Id));
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.MshNotFirstSegment, error.Code);
        Assert.Equal(2, error.LineNumber);
        Assert.Equal("MSH", error.SegmentId);
    }

    [Fact]
    public void Parse_MshWithoutFieldSeparator_ReturnsMalformedMshError()
    {
        var result = Parse("MSH\r" + SyntheticMessages.PidLine);

        Assert.Null(result.Message);
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.MalformedMshSegment, error.Code);
        Assert.Equal(1, error.LineNumber);
        Assert.Equal(1, error.FieldPosition);
    }

    [Theory]
    [InlineData("MSH|")]
    [InlineData("MSH|^~|SENDING_APP")]
    [InlineData("MSH|^~\\&#!|SENDING_APP")]
    public void Parse_MshWithWrongNumberOfEncodingCharacters_ReturnsInvalidEncodingCharactersError(string msh)
    {
        var result = Parse(msh + "\r" + SyntheticMessages.PidLine);

        Assert.Null(result.Message);
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.InvalidEncodingCharacters, error.Code);
        Assert.Equal(1, error.LineNumber);
        Assert.Equal("MSH", error.SegmentId);
        Assert.Equal(2, error.FieldPosition);
    }

    [Fact]
    public void Parse_MshWithDuplicateEncodingCharacters_ReturnsInvalidDelimitersError()
    {
        var result = Parse(@"MSH|^^\&|SENDING_APP");

        Assert.Null(result.Message);
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.InvalidDelimiters, error.Code);
        Assert.Equal(2, error.FieldPosition);
    }

    [Theory]
    [InlineData("pid|1")]
    [InlineData("P1|1")]
    [InlineData("PIDX|1")]
    [InlineData("1ID|1")]
    public void Parse_InvalidSegmentId_ReportsErrorWithLocationAndKeepsSegment(string line)
    {
        var result = Parse(SyntheticMessages.MshLine + "\r" + line + "\r" + SyntheticMessages.Pv1Line);

        Assert.False(result.IsSuccess);
        Assert.Equal(3, result.Message!.Segments.Count);
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.InvalidSegmentId, error.Code);
        Assert.Equal(2, error.LineNumber);
        Assert.Equal(line.Split('|')[0], error.SegmentId);
        Assert.Equal(Hl7SegmentType.Unsupported, result.Message.Segments[1].SegmentType);
    }

    [Fact]
    public void Parse_UnsupportedSegment_IsParsedGenericallyWithWarning()
    {
        var result = Parse(SyntheticMessages.MshLine + "\rEVN|A01|20260101120000\r" + SyntheticMessages.PidLine);

        Assert.True(result.IsSuccess);
        var evn = result.Message!.GetFirstSegment("EVN")!;
        Assert.False(evn.IsSupported);
        Assert.Equal("A01", evn.GetField(1)!.Value);
        var warning = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.UnsupportedSegment, warning.Code);
        Assert.Equal(Hl7ParseErrorSeverity.Warning, warning.Severity);
        Assert.Equal(2, warning.LineNumber);
        Assert.Equal("EVN", warning.SegmentId);
    }

    [Fact]
    public void Parse_AdditionalMsh_IsParsedAsMshWithWarning()
    {
        var result = Parse(SyntheticMessages.MshLine + "\r" + SyntheticMessages.PidLine + "\r" + SyntheticMessages.MshLine);

        Assert.True(result.IsSuccess);
        var mshSegments = result.Message!.GetSegments("MSH");
        Assert.Equal(2, mshSegments.Count);
        Assert.Equal(@"^~\&", mshSegments[1].GetField(2)!.Value);
        var warning = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.MultipleMshSegments, warning.Code);
        Assert.Equal(3, warning.LineNumber);
    }

    [Fact]
    public void Parse_MultipleProblems_AreReportedInLineOrder()
    {
        var result = Parse(SyntheticMessages.MshLine + "\rZZ1|x\rbad|y\rNTE|1");

        Assert.Equal(
            new[] { Hl7ParseErrorCode.UnsupportedSegment, Hl7ParseErrorCode.InvalidSegmentId, Hl7ParseErrorCode.UnsupportedSegment },
            result.Errors.Select(e => e.Code));
        Assert.Equal(new int?[] { 2, 3, 4 }, result.Errors.Select(e => e.LineNumber));
    }
}
