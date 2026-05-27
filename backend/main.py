from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from app.services.llm_service import get_agricultural_advice
from app.services.diagnosis_service import diagnose_plant
from typing import Optional

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to AgriVision AI API"}

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    weather: Optional[str] = Form(None),
    crop: Optional[str] = Form(None)
):
    # Read image bytes
    image_bytes = await file.read()
    
    # Real ML prediction using specialized models
    disease, confidence = await diagnose_plant(image_bytes, crop)
    
    # Get expert advice from Hugging Face LLM
    advice = await get_agricultural_advice(disease, confidence, weather)
    
    return {
        "filename": file.filename,
        "disease": disease,
        "confidence": round(float(confidence), 4),
        "treatment": advice
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
