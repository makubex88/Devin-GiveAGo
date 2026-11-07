using HL7Sentinel.Core.Models;
using HL7Sentinel.Core.Parsing;

namespace HL7Sentinel.Core.Tests;

public class Hl7DelimiterTests
{
    private const string CustomDelimitedMessage =
        "MSH*!@/$*SENDING_APP*SENDING_FAC*****ADT!A01*MSG00002*P*2.5.1\r" +
        "PID*1**TEST-MRN-0001!!!TEST_AUTH$0.0.0!MR@TEST-ALT-0002**SYNTHETIC!PATIENT";

    [Fact]
    public void Default_UsesStandardHl7Delimiters()
    {
        var d = Hl7Delimiters.Default;

        Assert.Equal('|', d.FieldSeparator);
        Assert.Equal('^', d.ComponentSeparator);
        Assert.Equal('~', d.RepetitionSeparator);
        Assert.Equal('\\', d.EscapeCharacter);
        Assert.Equal('&', d.SubcomponentSeparator);
        Assert.Null(d.TruncationCharacter);
        Assert.Equal(@"^~\&", d.EncodingCharacters);
        Assert.Empty(d.Validate());
    }

    [Fact]
    public void Parse_DetectsNonStandardDelimitersFromMsh()
    {
        var result = new Hl7Parser().Parse(CustomDelimitedMessage);

        Assert.True(result.IsSuccess);
        var message = result.Message!;
        Assert.Equal(new Hl7Delimiters('*', '!', '@', '/', '$'), message.Delimiters);

        var msh = message.Header!;
        Assert.Equal("*", msh.GetField(1)!.Value);
        Assert.Equal("!@/$", msh.GetField(2)!.Value);
        Assert.Equal("SENDING_APP", msh.GetField(3)!.Value);
        Assert.Equal("A01", msh.GetField(9)!.GetValue(2));
        Assert.Equal("2.5.1", msh.GetField(12)!.Value);

        var pid = message.GetFirstSegment("PID")!;
        Assert.True(pid.GetField(2)!.IsEmpty);
        Assert.Equal(2, pid.GetField(3)!.Repetitions.Count);
        Assert.Equal("0.0.0", pid.GetField(3)!.GetValue(4, 2));
        Assert.Equal("TEST-ALT-0002", pid.GetField(3)!.GetValue(1, repetition: 2));
        Assert.Equal("PATIENT", pid.GetField(5)!.GetValue(2));
    }

    [Fact]
    public void Parse_SupportsV27TruncationCharacter()
    {
        var result = new Hl7Parser().Parse(@"MSH|^~\&#|SENDING_APP|||||||MSG00003|P|2.7" + "\rPID|1");

        Assert.True(result.IsSuccess);
        Assert.Equal('#', result.Message!.Delimiters.TruncationCharacter);
        Assert.Equal(@"^~\&#", result.Message.Delimiters.EncodingCharacters);
        Assert.Equal(@"^~\&#", result.Message.Header!.GetField(2)!.Value);
        Assert.Equal("SENDING_APP", result.Message.Header.GetField(3)!.Value);
    }

    [Fact]
    public void Parse_WithMatchingConfiguredDelimiters_Succeeds()
    {
        var options = new Hl7ParserOptions { Delimiters = new Hl7Delimiters('*', '!', '@', '/', '$') };

        var result = new Hl7Parser(options).Parse(CustomDelimitedMessage);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Errors);
        Assert.Same(options.Delimiters, result.Message!.Delimiters);
    }

    [Fact]
    public void Parse_WithConfiguredDelimitersAndNoMsh_ParsesWhenMshNotRequired()
    {
        var options = new Hl7ParserOptions
        {
            Delimiters = new Hl7Delimiters('#', '^', '~', '\\', '&'),
            RequireMshSegment = false,
        };

        var result = new Hl7Parser(options).Parse("PID#1##TEST-MRN-0001~TEST-ALT-0002##SYNTHETIC^PATIENT");

        Assert.True(result.IsSuccess);
        var pid = Assert.Single(result.Message!.Segments);
        Assert.Equal("PID", pid.Id);
        Assert.Equal(5, pid.Fields.Count);
        Assert.Equal(2, pid.GetField(3)!.Repetitions.Count);
        Assert.Equal("SYNTHETIC", pid.GetField(5)!.GetValue(1));
    }

    [Fact]
    public void Parse_WithConfiguredDelimitersAndNoMsh_ReportsMissingMshWhenRequired()
    {
        var options = new Hl7ParserOptions { Delimiters = Hl7Delimiters.Default };

        var result = new Hl7Parser(options).Parse(SyntheticMessages.PidLine);

        Assert.False(result.IsSuccess);
        Assert.NotNull(result.Message);
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.MissingMshSegment, error.Code);
        Assert.Equal(Hl7ParseErrorSeverity.Error, error.Severity);
    }

    [Fact]
    public void Parse_WithConfiguredFieldSeparatorDifferentFromMsh1_ReportsMismatchError()
    {
        var options = new Hl7ParserOptions { Delimiters = new Hl7Delimiters('#', '^', '~', '\\', '&') };

        var result = new Hl7Parser(options).Parse(SyntheticMessages.Oru());

        Assert.False(result.IsSuccess);
        var error = Assert.Single(result.Errors, e => e.Code == Hl7ParseErrorCode.DelimiterMismatch);
        Assert.Equal(Hl7ParseErrorSeverity.Error, error.Severity);
        Assert.Equal(1, error.LineNumber);
        Assert.Equal("MSH", error.SegmentId);
        Assert.Equal(1, error.FieldPosition);
        Assert.Equal("|", result.Message!.Header!.GetField(1)!.Value);
    }

    [Fact]
    public void Parse_WithConfiguredEncodingCharactersDifferentFromMsh2_ReportsMismatchWarning()
    {
        var options = new Hl7ParserOptions { Delimiters = new Hl7Delimiters('|', '!', '~', '\\', '&') };

        var result = new Hl7Parser(options).Parse(SyntheticMessages.Oru());

        Assert.True(result.IsSuccess);
        var warning = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.DelimiterMismatch, warning.Code);
        Assert.Equal(Hl7ParseErrorSeverity.Warning, warning.Severity);
        Assert.Equal(2, warning.FieldPosition);
        Assert.Equal(@"^~\&", result.Message!.Header!.GetField(2)!.Value);
    }

    [Fact]
    public void Parse_WithInvalidConfiguredDelimiters_ReturnsErrorWithoutMessage()
    {
        var options = new Hl7ParserOptions { Delimiters = new Hl7Delimiters('|', '|', '~', '\\', '&') };

        var result = new Hl7Parser(options).Parse(SyntheticMessages.Oru());

        Assert.Null(result.Message);
        var error = Assert.Single(result.Errors);
        Assert.Equal(Hl7ParseErrorCode.InvalidDelimiters, error.Code);
    }

    [Theory]
    [InlineData('|', '^', '~', '\\', '^')]
    [InlineData('|', 'A', '~', '\\', '&')]
    [InlineData('|', '^', '1', '\\', '&')]
    [InlineData(' ', '^', '~', '\\', '&')]
    [InlineData('\r', '^', '~', '\\', '&')]
    [InlineData('|', '^', '~', '\n', '&')]
    public void Validate_RejectsInvalidDelimiters(char field, char component, char repetition, char escape, char subcomponent)
    {
        var delimiters = new Hl7Delimiters(field, component, repetition, escape, subcomponent);

        Assert.NotEmpty(delimiters.Validate());
    }

    [Fact]
    public void Validate_RejectsTruncationCharacterThatDuplicatesAnotherDelimiter()
    {
        var delimiters = new Hl7Delimiters('|', '^', '~', '\\', '&', '^');

        Assert.Single(delimiters.Validate());
    }

    [Theory]
    [InlineData("")]
    [InlineData("^~\\")]
    [InlineData("^~\\&#!")]
    public void FromEncodingCharacters_ReturnsNullForInvalidLength(string encodingCharacters)
    {
        Assert.Null(Hl7Delimiters.FromEncodingCharacters('|', encodingCharacters));
    }

    [Fact]
    public void FromEncodingCharacters_MapsCharactersInMsh2Order()
    {
        var d = Hl7Delimiters.FromEncodingCharacters('*', "!@/$#")!;

        Assert.Equal(new Hl7Delimiters('*', '!', '@', '/', '$', '#'), d);
    }
}
