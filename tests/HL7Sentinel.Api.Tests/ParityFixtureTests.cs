using System.Net;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json.Nodes;
using HL7Sentinel.Api.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;

namespace HL7Sentinel.Api.Tests;

// The TypeScript parser used by the Vercel function is tested against the same fixtures
// (frontend/src/parser/hl7Parser.test.ts), so both implementations must produce identical JSON.
public class ParityFixtureTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ParityFixtureTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    public static IEnumerable<object[]> FixtureNames() =>
        LoadFixtures().Select(f => new object[] { f["name"]!.GetValue<string>() });

    [Theory]
    [MemberData(nameof(FixtureNames))]
    public async Task Post_FixtureMessage_MatchesSharedExpectedJson(string name)
    {
        var fixture = LoadFixtures().Single(f => f["name"]!.GetValue<string>() == name);

        var response = await _client.PostAsJsonAsync("/api/parse", new ParseRequest(fixture["message"]!.GetValue<string>()));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var actual = JsonNode.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(
            JsonNode.DeepEquals(fixture["expected"], actual),
            $"Expected:\n{fixture["expected"]!.ToJsonString()}\nActual:\n{actual!.ToJsonString()}");
    }

    private static IEnumerable<JsonNode> LoadFixtures([CallerFilePath] string sourceFile = "")
    {
        var path = Path.Combine(Path.GetDirectoryName(sourceFile)!, "..", "..", "frontend", "src", "parser", "parity-fixtures.json");
        return JsonNode.Parse(File.ReadAllText(path))!.AsArray().Select(node => node!);
    }
}
