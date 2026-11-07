using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using HL7Sentinel.Api.Contracts;
using HL7Sentinel.Core.Models;
using HL7Sentinel.Core.Parsing;
using Microsoft.AspNetCore.Mvc.Testing;

namespace HL7Sentinel.Api.Tests;

public class ParseEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    // Synthetic, non-clinical data only.
    private const string SyntheticMessage =
        @"MSH|^~\&|SENDING_APP|SENDING_FAC|RECEIVING_APP|RECEIVING_FAC|20260101120000||ORU^R01^ORU_R01|MSG00001|P|2.5.1" + "\r" +
        "PID|1||TEST-MRN-0001~TEST-ALT-0002||SYNTHETIC^PATIENT^A\r" +
        "OBX|1|NM|TEST-CODE-1A^Synthetic Observation A^LOCAL||1|units|||||F";

    private readonly HttpClient _client;

    public ParseEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Post_ValidMessage_ReturnsParsedStructure()
    {
        var response = await _client.PostAsJsonAsync("/api/parse", new ParseRequest(SyntheticMessage));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ParseResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.True(body!.IsSuccess);
        Assert.Empty(body.Errors);
        Assert.Equal("|", body.Delimiters!.FieldSeparator);
        Assert.Equal(@"^~\&", body.Delimiters.EncodingCharacters);
        Assert.Equal(new[] { "MSH", "PID", "OBX" }, body.Segments.Select(s => s.Id));

        var msh = body.Segments[0];
        Assert.Equal(Hl7SegmentType.MSH, msh.SegmentType);
        Assert.Equal("|", msh.Fields[0].Value);
        Assert.Equal(@"^~\&", msh.Fields[1].Value);
        Assert.Equal("SENDING_APP", msh.Fields[2].Value);

        var pid = body.Segments[1];
        Assert.Equal(Enumerable.Range(1, 5), pid.Fields.Select(f => f.Position));
        Assert.True(pid.Fields[1].IsEmpty);
        Assert.Equal(2, pid.Fields[2].Repetitions.Count);
        Assert.Equal("PATIENT", pid.Fields[4].Repetitions[0].Components[1].Value);
    }

    [Fact]
    public async Task Post_MessageWithIssues_ReturnsStructuredErrors()
    {
        var response = await _client.PostAsJsonAsync("/api/parse", new ParseRequest(SyntheticMessage + "\rpv1|1"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ParseResponse>(JsonOptions);
        Assert.False(body!.IsSuccess);
        var error = Assert.Single(body.Errors);
        Assert.Equal(Hl7ParseErrorCode.InvalidSegmentId, error.Code);
        Assert.Equal(Hl7ParseErrorSeverity.Error, error.Severity);
        Assert.Equal(4, error.LineNumber);
        Assert.Equal("pv1", error.SegmentId);
    }

    [Fact]
    public async Task Post_SerializesEnumsAsStrings()
    {
        var response = await _client.PostAsJsonAsync("/api/parse", new ParseRequest(SyntheticMessage + "\rEVN|A01"));

        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"segmentType\":\"MSH\"", json);
        Assert.Contains("\"code\":\"UnsupportedSegment\"", json);
        Assert.Contains("\"severity\":\"Warning\"", json);
    }

    [Fact]
    public async Task Post_EmptyMessage_ReturnsEmptyMessageError()
    {
        var response = await _client.PostAsJsonAsync("/api/parse", new ParseRequest(""));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ParseResponse>(JsonOptions);
        Assert.False(body!.IsSuccess);
        Assert.Null(body.Delimiters);
        Assert.Empty(body.Segments);
        Assert.Equal(Hl7ParseErrorCode.EmptyMessage, Assert.Single(body.Errors).Code);
    }

    [Fact]
    public async Task Post_MissingMessage_ReturnsValidationProblem()
    {
        var response = await _client.PostAsJsonAsync("/api/parse", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
