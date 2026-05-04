using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace LiaAI;

static class GeminiService
{
    private const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    private const string DefaultModel = "gemini-2.5-flash";
    private const int TimeoutSec = 15;

    private static readonly string SystemPrompt = """
        Du beantwortest Multiple-Choice-Fragen. Beginne mit der Optionsnummer, dann die Antwort.

        Beispiel – Text: '1. Paris  2. London  3. Berlin – Was ist die Hauptstadt von Frankreich?'
        Deine Antwort: '1 – Paris ist die Hauptstadt von Frankreich.'

        Kein Markdown, keine Erklärungen, keine Zusatztexte.
        """;

    private static readonly HttpClient client = new()
    {
        Timeout = TimeSpan.FromSeconds(TimeoutSec),
    };

    private static string ApiKey =>
        UserSettings.Get("geminiKey", "");

    private static string Model =>
        UserSettings.Get("model", DefaultModel);

    private static string CustomPrompt =>
        UserSettings.Get("customPrompt", "");

    public static async Task<string> AnalyzeImageAsync(string base64Image)
    {
        if (string.IsNullOrEmpty(ApiKey))
            throw new InvalidOperationException("Kein API-Key konfiguriert");

        var prompt = string.IsNullOrEmpty(CustomPrompt) ? SystemPrompt : CustomPrompt;
        var url = $"{BaseUrl}/{Model}:generateContent?key={ApiKey}";

        var body = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new object[]
                    {
                        new { text = prompt },
                        new
                        {
                            inline_data = new
                            {
                                mime_type = "image/jpeg",
                                data = base64Image,
                            },
                        },
                    },
                },
            },
            generationConfig = new
            {
                maxOutputTokens = 2048,
                temperature = 0.3,
            },
        };

        var json = JsonSerializer.Serialize(body);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        var root = doc.RootElement;
        var text = root
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return text ?? "Keine Antwort";
    }
}
