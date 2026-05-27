using System.Diagnostics;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;

namespace AttendanceTrackerAPI.Services;

public sealed class DeepFaceVerifierService : IDeepFaceVerifierService
{
    private readonly IWebHostEnvironment _env;

    public DeepFaceVerifierService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<DeepFaceVerificationResult> VerifyAsync(
        string referenceImagePath,
        string selfieImagePath,
        CancellationToken cancellationToken = default)
    {
        var scriptPath = Path.Combine(_env.ContentRootPath, "python", "verify_face.py");
        if (!File.Exists(scriptPath))
        {
            throw new FileNotFoundException("DeepFace verification script not found.", scriptPath);
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = "python",
            Arguments = $"\"{scriptPath}\" \"{referenceImagePath}\" \"{selfieImagePath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };

        if (!process.Start())
        {
            throw new InvalidOperationException("Failed to start deepface python verification process.");
        }

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync(cancellationToken);

        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"DeepFace verification failed (exit code {process.ExitCode}). Error: {stderr}");
        }

        var payload = JsonSerializer.Deserialize<JsonElement>(stdout);

        var verified = payload.GetProperty("verified").GetBoolean();
        double? distance = null;
        if (payload.TryGetProperty("distance", out var distanceEl) && distanceEl.ValueKind != JsonValueKind.Null)
        {
            distance = distanceEl.GetDouble();
        }

        double? confidenceScore = null;
        if (payload.TryGetProperty("confidenceScore", out var confidenceEl) && confidenceEl.ValueKind != JsonValueKind.Null)
        {
            confidenceScore = confidenceEl.GetDouble();
        }

        double? threshold = null;
        if (payload.TryGetProperty("threshold", out var thresholdEl) && thresholdEl.ValueKind != JsonValueKind.Null)
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

