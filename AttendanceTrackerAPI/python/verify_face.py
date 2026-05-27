import json
import sys


def main() -> None:
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Expected: reference_path selfie_path"}))
        sys.exit(2)

    reference_path = sys.argv[1]
    selfie_path = sys.argv[2]

    # DeepFace verification using FaceNet model.
    from deepface import DeepFace

    result = DeepFace.verify(
        img1_path=reference_path,
        img2_path=selfie_path,
        model_name="Facenet",
    )

    verified = bool(result.get("verified"))
    distance = result.get("distance")
    threshold = result.get("threshold")

    # Convert distance to a 0..1-ish confidence value (lower distance => higher confidence).
    confidence_score = None
    if distance is not None:
        try:
            d = float(distance)
            confidence_score = 1.0 / (1.0 + d)
        except Exception:
            confidence_score = None

    print(
        json.dumps(
            {
                "verified": verified,
                "distance": distance,
                "threshold": threshold,
                "confidenceScore": confidence_score,
            }
        )
    )


if __name__ == "__main__":
    main()

