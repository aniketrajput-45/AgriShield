import requests
import os

# Improved TFLite model with 38 plant disease classes (PlantVillage)
MODEL_URL = "https://raw.githubusercontent.com/obeshor/Plant-Diseases-Detector/master/GreenDoctor/app/src/main/assets/plant_disease_model.tflite"
LABELS_URL = "https://raw.githubusercontent.com/obeshor/Plant-Diseases-Detector/master/categories.json"

MODEL_PATH = "backend/plant_disease_model.tflite"
LABELS_PATH = "backend/labels.txt"

def download_model():
    print(f"Downloading pre-trained TFLite model from: {MODEL_URL}")
    try:
        response = requests.get(MODEL_URL, stream=True)
        response.raise_for_status()
        with open(MODEL_PATH, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"SUCCESS! Model saved to {MODEL_PATH}")
    except Exception as e:
        print(f"Download Failed: {e}")

    print(f"Downloading labels from: {LABELS_URL}")
    try:
        r = requests.get(LABELS_URL)
        r.raise_for_status()
        categories = r.json()
        sorted_labels = sorted(categories.keys())
        with open(LABELS_PATH, "w") as f:
            for label in sorted_labels:
                clean_name = label.replace("___", " ").replace("_", " ")
                f.write(f"{clean_name}\n")
        print(f"SUCCESS! Labels saved to {LABELS_PATH}")
    except Exception as e:
        print(f"Download Failed: {e}")

if __name__ == "__main__":
    download_model()
