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
| **Edge Inference** | `.tflite` integration for offline scan. | Pending |
| **AI Diagnosis** | Name + Confidence score return. | Placeholder |
| **Advisory** | Treatment suggestions based on result. | Pending |
| **NPK Calculator** | DSA tool for fertilizer dosage. | Pending |
| **Weather Risk** | OpenWeatherMap API integration. | Pending |
| **Heatmap** | GPS-based outbreak tracking. | Pending |

## API Contract (Draft v1)
### `POST /predict`
- **Request:** Multi-part Form Data (Image)
- **Response:** `{ "disease": string, "confidence": float, "treatment": string }`

### `POST /report-outbreak`
- **Request:** `{ "disease": string, "lat": float, "lng": float }`
- **Response:** `{ "status": "logged" }`
