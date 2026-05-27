# AgriVision AI - Project Architecture & Specs

## Core Vision
To provide remote farmers with instant, offline-capable crop disease diagnosis and actionable AgTech insights using edge AI and mobile-first logic.

## Technical Stack
- **Frontend:** React Native (Expo) - Focused on UX, Offline Persistence, and Camera.
- **Backend:** Python FastAPI - Focused on ML Model management, API, and Geo-logging.
- **AI/ML:** CNN (MobileNetV2/V3) converted to `.tflite` for edge inference.

## MVP Features & Owners
| Feature | Description | Status |
| :--- | :--- | :--- |
| **Edge Inference** | `.tflite` integration for offline scan. | Implemented |
| **AI Diagnosis** | Name + Confidence score return. | Implemented (Inference API) |
| **Advisory** | Treatment suggestions based on result. | Implemented (Mistral-7B) |
| **NPK Calculator** | DSA tool for fertilizer dosage. | Pending |
| **Weather Risk** | OpenWeatherMap API integration. | Implemented (Pending API Key) |
| **Heatmap** | GPS-based outbreak tracking. | In Progress |

## API Contract (Draft v1)
### `POST /predict`
- **Request:** Multi-part Form Data (Image)
- **Response:** `{ "disease": string, "confidence": float, "treatment": string }`

### `POST /report-outbreak`
- **Request:** `{ "disease": string, "lat": float, "lng": float }`
- **Response:** `{ "status": "logged" }`
