from deepface import DeepFace

result = DeepFace.verify(
    img1_path="test1.jpg",
    img2_path="test2.jpg",
    model_name="Facenet"
)

print(result)