using System.Text.Json.Serialization;
using HL7Sentinel.Api.Endpoints;
using HL7Sentinel.Core.Parsing;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IHl7Parser>(_ => new Hl7Parser());
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var app = builder.Build();

app.MapParseEndpoints();

app.Run();

public partial class Program;
