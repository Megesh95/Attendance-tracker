import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
import json
from flask import Flask, request, jsonify
from deepface import DeepFace

app = Flask(__name__)

# Preload the Facenet model so subsequent requests are fast
print("Loading DeepFace model 'Facenet'...")
DeepFace.build_model("Facenet")
print("Model loaded successfully.")

@app.route('/verify', methods=['POST'])
def verify_face():
    data = request.json
    if not data or 'reference_path' not in data or 'selfie_path' not in data:
        return jsonify({"error": "Expected reference_path and selfie_path in json payload"}), 400

    reference_path = data['reference_path']
    selfie_path = data['selfie_path']

    try:
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

        return jsonify({
            "verified": verified,
            "distance": distance,
            "threshold": threshold,
            "confidenceScore": confidence_score
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Listen on localhost:5000
    app.run(host='127.0.0.1', port=5000)
