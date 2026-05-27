namespace AttendanceTrackerAPI.Services;

public sealed class DeepFaceVerificationResult
{
    public bool Verified { get; init; }

    public double? Distance { get; init; }

    public double? ConfidenceScore { get; init; }

    // Threshold from DeepFace verification.
    public double? Threshold { get; init; }
}

