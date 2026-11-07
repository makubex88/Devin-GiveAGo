using HL7Sentinel.Core.Models;
using HL7Sentinel.Core.Parsing;

namespace HL7Sentinel.Core.Tests;

public class Hl7ParserTests
{
    private static Hl7Message ParseSuccessfully(string message, Hl7ParserOptions? options = null)
    {
        var result = new Hl7Parser(options ?? Hl7ParserOptions.Default).Parse(message);
        Assert.True(result.IsSuccess, string.Join("; ", result.Errors.Select(e => $"{e.Code}: {e.Message}")));
        Assert.NotNull(result.Message);
        return result.Message!;
    }

    [Fact]
    public void Parse_SyntheticOru_ReturnsAllSupportedSegmentsInOrder()
    {
        var result = new Hl7Parser().Parse(SyntheticMessages.Oru());

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Errors);
        var message = Assert.IsType<Hl7Message>(result.Message);
        Assert.Equal(new[] { "MSH", "PID", "PV1", "ORC", "OBR", "OBX", "OBX" }, message.Segments.Select(s => s.Id));
        Assert.Equal(
            new[]
            {
                Hl7SegmentType.MSH, Hl7SegmentType.PID, Hl7SegmentType.PV1, Hl7SegmentType.ORC,
                Hl7SegmentType.OBR, Hl7SegmentType.OBX, Hl7SegmentType.OBX,
            },
            message.Segments.Select(s => s.SegmentType));
        Assert.All(message.Segments, s => Assert.True(s.IsSupported));
        Assert.Equal(Enumerable.Range(0, 7), message.Segments.Select(s => s.Index));
        Assert.Equal(Enumerable.Range(1, 7), message.Segments.Select(s => s.LineNumber));
        Assert.Equal(Hl7Delimiters.Default, message.Delimiters);
    }

    [Fact]
    public void Parse_Msh_TreatsMsh1AsFieldSeparatorAndMsh2AsUnsplitEncodingCharacters()
    {
        var msh = ParseSuccessfully(SyntheticMessages.Oru()).Header!;

        var msh1 = msh.GetField(1)!;
        Assert.Equal(1, msh1.Position);
        Assert.Equal("|", msh1.Value);

        var msh2 = msh.GetField(2)!;
        Assert.Equal(2, msh2.Position);
        Assert.Equal(@"^~\&", msh2.Value);
        Assert.Single(msh2.Repetitions);
        Assert.Single(msh2.Repetitions[0].Components);
        Assert.Single(msh2.Repetitions[0].Components[0].Subcomponents);
        Assert.Equal(@"^~\&", msh2.GetValue());
    }

    [Fact]
    public void Parse_Msh_UsesHl7FieldNumbering()
    {
        var msh = ParseSuccessfully(SyntheticMessages.Oru()).Header!;

        Assert.Equal(12, msh.Fields.Count);
        Assert.Equal("SENDING_APP", msh.GetField(3)!.Value);
        Assert.Equal("SENDING_FAC", msh.GetField(4)!.Value);
        Assert.Equal("RECEIVING_APP", msh.GetField(5)!.Value);
        Assert.Equal("RECEIVING_FAC", msh.GetField(6)!.Value);
        Assert.Equal("20260101120000", msh.GetField(7)!.Value);
        Assert.True(msh.GetField(8)!.IsEmpty);
        Assert.Equal("ORU", msh.GetField(9)!.GetValue(1));
        Assert.Equal("R01", msh.GetField(9)!.GetValue(2));
        Assert.Equal("ORU_R01", msh.GetField(9)!.GetValue(3));
        Assert.Equal("MSG00001", msh.GetField(10)!.Value);
        Assert.Equal("P", msh.GetField(11)!.Value);
        Assert.Equal("2.5.1", msh.GetField(12)!.Value);
        Assert.Null(msh.GetField(13));
    }

    [Fact]
    public void Parse_Pid_PreservesEmptyFieldsAndPositions()
    {
        var pid = ParseSuccessfully(SyntheticMessages.Oru()).GetFirstSegment("PID")!;

        Assert.Equal(11, pid.Fields.Count);
        Assert.Equal("1", pid.GetField(1)!.Value);
        Assert.True(pid.GetField(2)!.IsEmpty);
        Assert.True(pid.GetField(4)!.IsEmpty);
        Assert.Equal("SYNTHETIC", pid.GetField(5)!.GetValue(1));
        Assert.Equal("PATIENT", pid.GetField(5)!.GetValue(2));
        Assert.Equal("A", pid.GetField(5)!.GetValue(3));
        Assert.True(pid.GetField(6)!.IsEmpty);
        Assert.Equal("19000101", pid.GetField(7)!.Value);
        Assert.Equal("U", pid.GetField(8)!.Value);
        Assert.True(pid.GetField(9)!.IsEmpty);
        Assert.True(pid.GetField(10)!.IsEmpty);
        Assert.Equal("TESTVILLE", pid.GetField(11)!.GetValue(3));
    }

    [Fact]
    public void Parse_Pid_PreservesRepetitionsComponentsAndSubcomponents()
    {
        var pid3 = ParseSuccessfully(SyntheticMessages.Oru()).GetFirstSegment("PID")!.GetField(3)!;

        Assert.Equal(2, pid3.Repetitions.Count);
        Assert.Equal(new[] { 1, 2 }, pid3.Repetitions.Select(r => r.Index));

        var first = pid3.Repetitions[0];
        Assert.Equal(5, first.Components.Count);
        Assert.Equal(new[] { 1, 2, 3, 4, 5 }, first.Components.Select(c => c.Position));
        Assert.Equal("TEST-MRN-0001", first.GetComponent(1)!.Value);
        Assert.True(first.GetComponent(2)!.IsEmpty);
        Assert.True(first.GetComponent(3)!.IsEmpty);
        Assert.Equal("TEST_AUTH&0.0.0&ISO", first.GetComponent(4)!.Value);
        Assert.Equal(new[] { "TEST_AUTH", "0.0.0", "ISO" }, first.GetComponent(4)!.Subcomponents.Select(s => s.Value));
        Assert.Equal("MR", first.GetComponent(5)!.Value);

        Assert.Equal("TEST-ALT-0002", pid3.GetValue(1, repetition: 2));
        Assert.Equal("PI", pid3.GetValue(5, repetition: 2));
        Assert.Equal("0.0.0", pid3.GetValue(4, 2));
    }

    [Fact]
    public void Parse_Pv1_ParsesFields()
    {
        var pv1 = ParseSuccessfully(SyntheticMessages.Oru()).GetFirstSegment("PV1")!;

        Assert.Equal(7, pv1.Fields.Count);
        Assert.Equal("O", pv1.GetField(2)!.Value);
        Assert.Equal("ROOM-1", pv1.GetField(3)!.GetValue(2));
        Assert.True(pv1.GetField(4)!.IsEmpty);
        Assert.True(pv1.GetField(6)!.IsEmpty);
        Assert.Equal("TEST-PROV-001", pv1.GetField(7)!.GetValue(1));
    }

    [Fact]
    public void Parse_OrcAndObr_ParseFields()
    {
        var message = ParseSuccessfully(SyntheticMessages.Oru());
        var orc = message.GetFirstSegment("ORC")!;
        var obr = message.GetFirstSegment("OBR")!;

        Assert.Equal(3, orc.Fields.Count);
        Assert.Equal("RE", orc.GetField(1)!.Value);
        Assert.Equal("TEST-ORDER-0001", orc.GetField(2)!.Value);
        Assert.Equal("TEST-FILLER-0001", orc.GetField(3)!.Value);

        Assert.Equal(4, obr.Fields.Count);
        Assert.Equal("TEST-ORDER-0001", obr.GetField(2)!.Value);
        Assert.Equal("Synthetic Test Panel", obr.GetField(4)!.GetValue(2));
    }

    [Fact]
    public void Parse_Obx_ParsesEachRepeatedSegmentIndependently()
    {
        var obx = ParseSuccessfully(SyntheticMessages.Oru()).GetSegments("OBX");

        Assert.Equal(2, obx.Count);
        Assert.Equal(11, obx[0].Fields.Count);
        Assert.Equal("NM", obx[0].GetField(2)!.Value);
        Assert.Equal("TEST-CODE-1A", obx[0].GetField(3)!.GetValue(1));
        Assert.True(obx[0].GetField(4)!.IsEmpty);
        Assert.Equal("1", obx[0].GetField(5)!.Value);
        Assert.Equal("units", obx[0].GetField(6)!.Value);
        Assert.Equal("F", obx[0].GetField(11)!.Value);

        Assert.Equal(11, obx[1].Fields.Count);
        Assert.Equal("ST", obx[1].GetField(2)!.Value);
        Assert.Equal("Synthetic text", obx[1].GetField(5)!.Value);
        Assert.True(obx[1].GetField(6)!.IsEmpty);
        Assert.Equal("F", obx[1].GetField(11)!.Value);
    }

    [Fact]
    public void Parse_EveryFieldPositionMatchesItsIndex()
    {
        var message = ParseSuccessfully(SyntheticMessages.Oru());

        Assert.All(message.Segments, segment =>
            Assert.Equal(Enumerable.Range(1, segment.Fields.Count), segment.Fields.Select(f => f.Position)));
    }

    [Fact]
    public void Parse_PreservesTrailingEmptyFields()
    {
        var message = ParseSuccessfully(SyntheticMessages.MshLine + "\rPID|1|||");
        var pid = message.GetFirstSegment("PID")!;

        Assert.Equal(4, pid.Fields.Count);
        Assert.Equal("1", pid.GetField(1)!.Value);
        Assert.True(pid.GetField(2)!.IsEmpty);
        Assert.True(pid.GetField(3)!.IsEmpty);
        Assert.True(pid.GetField(4)!.IsEmpty);
    }

    [Fact]
    public void Parse_PreservesEmptyRepetitionsComponentsAndSubcomponents()
    {
        var message = ParseSuccessfully(SyntheticMessages.MshLine + "\rPID|1||~A^^C&&E~");
        var field = message.GetFirstSegment("PID")!.GetField(3)!;

        Assert.Equal(3, field.Repetitions.Count);
        Assert.True(field.Repetitions[0].IsEmpty);
        Assert.Single(field.Repetitions[0].Components);
        Assert.True(field.Repetitions[2].IsEmpty);

        var middle = field.Repetitions[1];
        Assert.Equal("A^^C&&E", middle.Value);
        Assert.Equal(new[] { "A", "", "C&&E" }, middle.Components.Select(c => c.Value));
        Assert.Equal(new[] { "C", "", "E" }, middle.GetComponent(3)!.Subcomponents.Select(s => s.Value));
        Assert.Equal(new[] { 1, 2, 3 }, middle.GetComponent(3)!.Subcomponents.Select(s => s.Position));
    }

    [Fact]
    public void Parse_SegmentWithOnlyIdentifier_HasNoFields()
    {
        var message = ParseSuccessfully(SyntheticMessages.MshLine + "\rPID");

        Assert.Empty(message.GetFirstSegment("PID")!.Fields);
    }

    [Fact]
    public void Parse_PreservesRawSegmentText()
    {
        var message = ParseSuccessfully(SyntheticMessages.Oru());

        Assert.Equal(SyntheticMessages.OruLines, message.Segments.Select(s => s.Value));
        Assert.Equal(SyntheticMessages.Oru(), string.Join("\r", message.Segments.Select(s => s.Value)));
    }

    [Fact]
    public void Parse_KeepsEscapeSequencesVerbatim()
    {
        var message = ParseSuccessfully(SyntheticMessages.MshLine + "\r" + @"OBX|1|ST|||A\F\B\S\C\T\D\R\E\E\F");
        var obx5 = message.GetFirstSegment("OBX")!.GetField(5)!;

        Assert.Equal(@"A\F\B\S\C\T\D\R\E\E\F", obx5.Value);
        Assert.Single(obx5.Repetitions);
        Assert.Single(obx5.Repetitions[0].Components);
        Assert.Single(obx5.Repetitions[0].Components[0].Subcomponents);
    }

    [Fact]
    public void Parse_ExplicitNullIsPreserved()
    {
        var message = ParseSuccessfully(SyntheticMessages.MshLine + "\rPID|1|\"\"|");
        var pid = message.GetFirstSegment("PID")!;

        Assert.True(pid.GetField(2)!.IsNull);
        Assert.False(pid.GetField(2)!.IsEmpty);
        Assert.Equal("\"\"", pid.GetField(2)!.Value);
        Assert.True(pid.GetField(3)!.IsEmpty);
        Assert.False(pid.GetField(3)!.IsNull);
    }

    [Theory]
    [InlineData("\r")]
    [InlineData("\n")]
    [InlineData("\r\n")]
    public void Parse_AcceptsStandardAndLineFeedTerminators(string terminator)
    {
        var message = ParseSuccessfully(SyntheticMessages.Oru(terminator) + terminator);

        Assert.Equal(SyntheticMessages.OruLines, message.Segments.Select(s => s.Value));
        Assert.Equal(Enumerable.Range(1, 7), message.Segments.Select(s => s.LineNumber));
    }

    [Fact]
    public void Parse_SkipsBlankLinesButKeepsOriginalLineNumbers()
    {
        var message = ParseSuccessfully(SyntheticMessages.MshLine + "\r\r   \r" + SyntheticMessages.PidLine + "\r");

        Assert.Equal(2, message.Segments.Count);
        Assert.Equal(1, message.Segments[0].LineNumber);
        Assert.Equal(4, message.Segments[1].LineNumber);
        Assert.Equal(1, message.Segments[1].Index);
    }

    [Fact]
    public void Parse_WithLineFeedTerminatorsDisabled_TreatsLineFeedAsData()
    {
        var options = new Hl7ParserOptions { AllowLineFeedTerminators = false };
        var message = ParseSuccessfully(SyntheticMessages.MshLine + "\rOBX|1|ST|||line1\nline2", options);

        Assert.Equal(2, message.Segments.Count);
        Assert.Equal("line1\nline2", message.GetFirstSegment("OBX")!.GetField(5)!.Value);
    }

    [Fact]
    public void Parse_OutOfRangeLookupsReturnNullOrEmpty()
    {
        var pid = ParseSuccessfully(SyntheticMessages.Oru()).GetFirstSegment("PID")!;

        Assert.Null(pid.GetField(0));
        Assert.Null(pid.GetField(99));
        Assert.Null(pid.GetField(5)!.GetRepetition(2));
        Assert.Null(pid.GetField(5)!.Repetitions[0].GetComponent(9));
        Assert.Equal(string.Empty, pid.GetField(5)!.GetValue(9));
        Assert.Equal(string.Empty, pid.GetField(5)!.GetValue(1, 2));
    }

    [Fact]
    public void Parse_IsDeterministic()
    {
        var parser = new Hl7Parser();
        var first = parser.Parse(SyntheticMessages.Oru()).Message!;
        var second = parser.Parse(SyntheticMessages.Oru()).Message!;

        static IEnumerable<string> Flatten(Hl7Message m) =>
            m.Segments.SelectMany(s => s.Fields.SelectMany(f => f.Repetitions.SelectMany(r =>
                r.Components.SelectMany(c => c.Subcomponents.Select(sc =>
                    $"{s.Index}:{s.Id}-{f.Position}[{r.Index}].{c.Position}.{sc.Position}={sc.Value}")))));

        Assert.Equal(Flatten(first), Flatten(second));
    }
}
