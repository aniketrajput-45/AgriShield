from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

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
async def predict(file: UploadFile = File(...)):
    # Placeholder for ML prediction logic
    return {
        "filename": file.filename,
        "prediction": "Healthy",
        "confidence": 0.95
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
