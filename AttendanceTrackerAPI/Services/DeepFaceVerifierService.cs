using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

namespace AttendanceTrackerAPI.Services;

public sealed class DeepFaceVerifierService : IDeepFaceVerifierService
{
    private readonly HttpClient _httpClient;

    public DeepFaceVerifierService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("http://127.0.0.1:5000");
    }

    public async Task<DeepFaceVerificationResult> VerifyAsync(
        string referenceImagePath,
        string selfieImagePath,
        CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            reference_path = referenceImagePath,
            selfie_path = selfieImagePath
        };

        var response = await _httpClient.PostAsJsonAsync("/verify", payload, cancellationToken);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);

        var verified = result.GetProperty("verified").GetBoolean();
        double? distance = null;
        if (result.TryGetProperty("distance", out var distanceEl) && distanceEl.ValueKind != JsonValueKind.Null)
        {
            distance = distanceEl.GetDouble();
        }

        double? confidenceScore = null;
        if (result.TryGetProperty("confidenceScore", out var confidenceEl) && confidenceEl.ValueKind != JsonValueKind.Null)
        {
            confidenceScore = confidenceEl.GetDouble();
        }

        double? threshold = null;
        if (result.TryGetProperty("threshold", out var thresholdEl) && thresholdEl.ValueKind != JsonValueKind.Null)
        {
            threshold = thresholdEl.GetDouble();
        }

        return new DeepFaceVerificationResult
        {
            Verified = verified,
            Distance = distance,
            ConfidenceScore = confidenceScore,
            Threshold = threshold
        };
    }
}

