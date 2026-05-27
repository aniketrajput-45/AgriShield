import io
import os
import asyncio
import numpy as np
import tensorflow as tf
from PIL import Image
from huggingface_hub import AsyncInferenceClient
from dotenv import load_dotenv

# Robust pathing for .env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

HF_API_KEY = os.getenv("HF_API_KEY").strip() if os.getenv("HF_API_KEY") else None

# Edge AI Configuration (TFLite)
TFLITE_MODEL_PATH = os.path.join(BASE_DIR, "plant_disease_model.tflite")
LABELS_PATH = os.path.join(BASE_DIR, "labels.txt")

_INTERPRETER = None
_LABELS = []

# Fallback classes if labels.txt is missing
DEFAULT_CLASSES = [
    'Apple Scab', 'Apple Black Rot', 'Apple Cedar Rust', 'Apple Healthy',
    'Blueberry Healthy', 'Cherry Powdery Mildew', 'Cherry Healthy',
    'Corn Cercospora Leaf Spot', 'Corn Common Rust', 'Corn Northern Leaf Blight', 'Corn Healthy',
    'Grape Black Rot', 'Grape Black Measles', 'Grape Leaf Blight', 'Grape Healthy',
    'Orange Huanglongbing', 'Peach Bacterial Spot', 'Peach Healthy',
    'Pepper Bell Bacterial Spot', 'Pepper Bell Healthy', 'Potato Early Blight', 'Potato Late Blight', 'Potato Healthy',
    'Raspberry Healthy', 'Soybean Healthy', 'Squash Powdery Mildew', 'Strawberry Leaf Scorch', 'Strawberry Healthy',
    'Tomato Bacterial Spot', 'Tomato Early Blight', 'Tomato Late Blight', 'Tomato Leaf Mold',
    'Tomato Septoria Leaf Spot', 'Tomato Spider Mites', 'Tomato Target Spot',
    'Tomato Mosaic Virus', 'Tomato Yellow Leaf Curl Virus', 'Tomato Healthy'
]

# HF Configuration (Secondary Fallback)
PRIMARY_HF_MODEL = "dima806/plant-disease-detection-vit"
client = AsyncInferenceClient(token=HF_API_KEY)

def load_edge_model():
    global _INTERPRETER, _LABELS
    if _INTERPRETER is None:
        if os.path.exists(TFLITE_MODEL_PATH):
            print(f"DEBUG: Loading Edge TFLite model from {TFLITE_MODEL_PATH}...")
            _INTERPRETER = tf.lite.Interpreter(model_path=TFLITE_MODEL_PATH)
            _INTERPRETER.allocate_tensors()
            
            # Load labels
            if os.path.exists(LABELS_PATH):
                with open(LABELS_PATH, "r") as f:
                    _LABELS = [line.strip().replace("_", " ").title() for line in f.readlines()]
            else:
                print("DEBUG: labels.txt not found, using default PlantVillage classes.")
                _LABELS = DEFAULT_CLASSES
        else:
            print(f"DEBUG: Edge model not found at {TFLITE_MODEL_PATH}")
    return _INTERPRETER, _LABELS

async def diagnose_plant(image_bytes: bytes, selected_crop: str = None):
    # Normalize input
    raw_crop = str(selected_crop).strip() if selected_crop else "Unknown"
    print(f"DEBUG: --- Diagnosis Start ---")
    print(f"DEBUG: Received Crop from App: '{raw_crop}'")
    
    # Map 'Maize' to 'Corn' for the dataset
    crop_alias = "Corn" if raw_crop.lower() in ["maize", "corn"] else raw_crop
    print(f"DEBUG: Mapped Search Term: '{crop_alias}'")

    # 1. Try Local Edge AI (TFLite)
    interpreter, labels = load_edge_model()
    if interpreter:
        try:
            print("DEBUG: Running TFLite Inference...")
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()
            
            img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            img = img.resize(input_details[0]['shape'][1:3])
            
            img_array = (np.array(img).astype(np.float32) / 127.5) - 1.0
            img_array = np.expand_dims(img_array, axis=0)
            
            interpreter.set_tensor(input_details[0]['index'], img_array)
            interpreter.invoke()
            
            predictions = interpreter.get_tensor(output_details[0]['index'])[0]
            
            # --- Robust Filtering Logic ---
            relevant_indices = [i for i, l in enumerate(labels) if crop_alias.lower() in l.lower()]
            
            if relevant_indices:
                print(f"DEBUG: Found {len(relevant_indices)} relevant classes for {crop_alias}")
                # Filter predictions to only relevant ones
                filtered_preds = {i: predictions[i] for i in relevant_indices}
                best_idx = max(filtered_preds, key=filtered_preds.get)
            else:
                print(f"DEBUG: WARNING - No classes found for '{crop_alias}'. Using global best.")
                best_idx = np.argmax(predictions)
            
            label = labels[best_idx]
            confidence = float(predictions[best_idx])
            
            print(f"DEBUG: Final Edge Result: {label} ({confidence:.2%})")
            return label, confidence
            
        except Exception as e:
            print(f"DEBUG: Local Inference Error: {str(e)}")

    # 2. HF Fallback with SAME Filtering
    if HF_API_KEY:
        try:
            print(f"DEBUG: Falling back to HF API with Filtering...")
            results = await client.image_classification(image=image_bytes, model=PRIMARY_HF_MODEL)
            if results and isinstance(results, list):
                # Filter HF results
                relevant_results = [res for res in results if crop_alias.lower() in getattr(res, 'label', res.get('label', '')).lower()]
                
                final_res = relevant_results[0] if relevant_results else results[0]
                label = getattr(final_res, 'label', final_res.get('label', ''))
                score = getattr(final_res, 'score', final_res.get('score', 0.0))
                
                clean_label = label.replace("___", " ").replace("_", " ").title()
                print(f"DEBUG: Final HF Result: {clean_label} ({score:.2%})")
                return clean_label, score
        except Exception as e:
            print(f"DEBUG: HF Fallback Error: {str(e)}")

    return f"{raw_crop} Healthy/Unknown", 0.95
