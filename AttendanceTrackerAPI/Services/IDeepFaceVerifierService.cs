using AttendanceTrackerAPI.Services;

namespace AttendanceTrackerAPI.Services;

public interface IDeepFaceVerifierService
{
    Task<DeepFaceVerificationResult> VerifyAsync(
        string referenceImagePath,
        string selfieImagePath,
        CancellationToken cancellationToken = default
    );
}

