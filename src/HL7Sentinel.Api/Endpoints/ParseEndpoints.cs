using HL7Sentinel.Api.Contracts;
using HL7Sentinel.Core.Parsing;

namespace HL7Sentinel.Api.Endpoints;

public static class ParseEndpoints
{
    public const int MaxMessageLength = 1_000_000;

    public static IEndpointRouteBuilder MapParseEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/parse", Parse);
        return app;
    }

    private static IResult Parse(ParseRequest request, IHl7Parser parser)
    {
        if (request.Message is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(ParseRequest.Message)] = new[] { "A message is required." },
            });
        }

        if (request.Message.Length > MaxMessageLength)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(ParseRequest.Message)] = new[] { $"The message must not exceed {MaxMessageLength} characters." },
            });
        }

        return Results.Ok(ParseResponse.From(parser.Parse(request.Message)));
    }
}
