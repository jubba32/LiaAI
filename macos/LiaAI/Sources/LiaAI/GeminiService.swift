import Foundation

class GeminiService: @unchecked Sendable {
    static let shared = GeminiService()
    private let baseURL = "https://generativelanguage.googleapis.com/v1beta/models"
    private let timeout: TimeInterval = 15
    private let defaultModel = "gemini-2.5-flash"

    private let systemPrompt = """
    Du beantwortest Multiple-Choice-Fragen. Beginne mit der Optionsnummer, dann die Antwort.

    Beispiel – Text: '1. Paris  2. London  3. Berlin – Was ist die Hauptstadt von Frankreich?'
    Deine Antwort: '1 – Paris ist die Hauptstadt von Frankreich.'

    Kein Markdown, keine Erklärungen, keine Zusatztexte.
    """

    private var apiKey: String {
        UserDefaults.standard.string(forKey: "geminiKey") ?? ""
    }

    private var model: String {
        UserDefaults.standard.string(forKey: "model") ?? defaultModel
    }

    private var customPrompt: String {
        UserDefaults.standard.string(forKey: "customPrompt") ?? ""
    }

    func analyze(imageBase64: String) async throws -> String {
        guard !apiKey.isEmpty else { throw GeminiError.noApiKey }

        let prompt = customPrompt.isEmpty ? systemPrompt : customPrompt
        let urlStr = "\(baseURL)/\(model):generateContent?key=\(apiKey)"
        guard let url = URL(string: urlStr) else { throw GeminiError.invalidURL }

        var request = URLRequest(url: url, timeoutInterval: timeout)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "contents": [[
                "role": "user",
                "parts": [
                    ["text": prompt],
                    ["inline_data": [
                        "mime_type": "image/jpeg",
                        "data": imageBase64,
                    ]],
                ],
            ]],
            "generationConfig": [
                "maxOutputTokens": 2048,
                "temperature": 0.3,
            ],
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw GeminiError.httpError((response as? HTTPURLResponse)?.statusCode ?? 0)
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let candidates = json["candidates"] as? [[String: Any]],
              let content = candidates.first?["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let text = parts.first?["text"] as? String
        else {
            throw GeminiError.noAnswer
        }

        return text
    }

    func analyze(text: String) async throws -> String {
        guard !apiKey.isEmpty else { throw GeminiError.noApiKey }

        let prompt = customPrompt.isEmpty ? systemPrompt : customPrompt
        let urlStr = "\(baseURL)/\(model):generateContent?key=\(apiKey)"
        guard let url = URL(string: urlStr) else { throw GeminiError.invalidURL }

        var request = URLRequest(url: url, timeoutInterval: timeout)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "contents": [[
                "role": "user",
                "parts": [
                    ["text": "\(prompt)\n\n\(text)"],
                ],
            ]],
            "generationConfig": [
                "maxOutputTokens": 2048,
                "temperature": 0.3,
            ],
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw GeminiError.httpError((response as? HTTPURLResponse)?.statusCode ?? 0)
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let candidates = json["candidates"] as? [[String: Any]],
              let content = candidates.first?["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let text = parts.first?["text"] as? String
        else {
            throw GeminiError.noAnswer
        }

        return text
    }
}

enum GeminiError: LocalizedError {
    case noApiKey, invalidURL, httpError(Int), noAnswer

    var errorDescription: String? {
        switch self {
        case .noApiKey: return "Kein API-Key konfiguriert"
        case .invalidURL: return "Ungültige API-URL"
        case .httpError(let code): return "HTTP-Fehler \(code)"
        case .noAnswer: return "Keine Antwort vom Modell"
        }
    }
}
