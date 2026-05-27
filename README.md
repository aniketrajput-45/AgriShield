# AgriShield 🌾🛡️

AgriShield is an AI-powered agricultural mobile application designed to empower farmers by providing real-time crop disease diagnosis and specialized treatment advisory. By leveraging an optimized TensorFlow Lite neural network on the edge and an advanced Language Model (LLM) backend, AgriShield delivers instant, contextual guidance directly in the field.

---

## 🚀 Key Features
* **Intelligent Scan Camera**: Integrated React Native mobile camera system for capturing clear images of affected plant leaves.
* **High-Speed Machine Learning Inference**: Built on FastAPI, the backend processes images quickly to accurately predict disease types and confidence metrics.
* **Context-Aware Advice**: Combines ML classification results with local weather profiles and crop species to fetch expert recovery treatments using a specialized LLM service.
* **Geolocated Recommendations**: Fully prepared for location-aware environmental telemetry mapping.

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
* **Framework**: React Native with Expo (SDK 54)
* **Hardware APIs**: `expo-camera`, `expo-image-picker`, `expo-location`
* **HTTP Client**: Axios

### Backend (AI Engine)
* **Framework**: FastAPI (Python 3.13+)
* **Server**: Uvicorn
* **ML Engine**: TensorFlow Lite (MobileNetV2 optimized architecture)
* **Advisory Layer**: Hugging Face Inference API

---

## 📁 Repository Structure

```text
AgriShield/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── diagnosis_service.py   # Runs local TFLite plant diagnostics
│   │   │   └── llm_service.py         # Interacts with Hugging Face API
│   │   └── ...
│   ├── main.py                        # FastAPI entrypoint & router configurations
│   ├── plant_disease_model.tflite     # Optimized ML weights file
│   ├── labels.txt                     # Text labels for detected disease classes
│   └── .env                           # Local environmental configuration (Ignored by Git)
├── frontend/
│   ├── src/
│   ├── App.js                         # Main application layout entry
│   ├── package.json                   # Mobile dependencies & scripts
│   └── ...
└── .gitignore                         # Project tracking restrictions

```

---

## 🔧 Installation & Setup

### 1. Prerequisites

* Node.js (v18 or higher recommended)
* Python (v3.10 to v3.13)
* Expo Go app installed on your physical mobile device (iOS/Android)

### 2. Backend Setup

Navigate to the backend directory and establish your local workspace environment:

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the environment
# For Windows:
.\venv\Scripts\activate
# For macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

```

Create a `.env` file inside the `backend/` directory to store your credentials securely:

```text
HF_TOKEN=your_hugging_face_user_access_token_here

```

Start your backend server locally:

```bash
python main.py

```

The FastAPI instance will now be live at `http://localhost:8000`.

### 3. Frontend Setup

Open a secondary terminal window, navigate to your frontend directory, and spin up the Expo development environment:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Expo Metro Bundler
npm run start

```

Scan the generated QR code using your phone's camera (iOS) or the **Expo Go** app (Android) to deploy the frontend directly on your device.

---

## 🔌 API Reference

### Plant Diagnostic Prediction

* **Endpoint**: `/predict`
* **Method**: `POST`
* **Content-Type**: `multipart/form-data`

#### Request Parameters:

| Parameter | Type | Required/Optional | Description |
| --- | --- | --- | --- |
| `file` | Binary (File) | **Required** | The camera image of the leaf to classify. |
| `crop` | String (Form) | Optional | The target crop variety (e.g., "Tomato", "Potato"). |
| `weather` | String (Form) | Optional | Recent or local ambient climate conditions. |

#### Example Response Body:

```json
{
  "filename": "leaf_scan.jpg",
  "disease": "Tomato___Early_blight",
  "confidence": 0.9734,
  "treatment": "1. Remove infected lower leaves immediately to stop spore distribution.\n2. Apply organic copper-based fungicides if humidity persists.\n3. Implement drip irrigation instead of overhead watering to keep foliage dry."
}

```

```

```
