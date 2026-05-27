from huggingface_hub import AsyncInferenceClient
import os
import asyncio
from dotenv import load_dotenv

# Robust pathing for .env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

HF_API_KEY = os.getenv("HF_API_KEY").strip() if os.getenv("HF_API_KEY") else None

# Verified models for HF Inference API (Chat Completion)
PRIMARY_MODEL = "Qwen/Qwen2.5-7B-Instruct"
BACKUP_MODELS = [
    "HuggingFaceH4/zephyr-7b-beta",
    "microsoft/Phi-3-mini-4k-instruct"
]

client = AsyncInferenceClient(token=HF_API_KEY)

async def get_agricultural_advice(disease, confidence, weather_context=None):
    if not HF_API_KEY:
        print("CRITICAL: HF_API_KEY is not set in .env")
        return "Advice unavailable: HF_API_KEY not set."

    prompt = f"Expert Agronomist Advice: The plant has '{disease}' with {confidence*100}% confidence. "
    if weather_context:
        prompt += f"Weather: {weather_context}. "
    prompt += "Provide a 3-step treatment plan."

    messages = [{"role": "user", "content": prompt}]

    async def try_model(model_id):
        print(f"DEBUG: Calling HF Inference API (Async Chat) for model: {model_id}")
        try:
            response = await client.chat_completion(
                messages=messages,
                model=model_id,
                max_tokens=200,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"DEBUG: Model {model_id} failed: {str(e)}")
            return None

    # Try Primary
    advice = await try_model(PRIMARY_MODEL)
    
    # Try Backups if Primary fails
    if not advice:
        for backup in BACKUP_MODELS:
            print(f"Trying backup model: {backup}...")
            advice = await try_model(backup)
            if advice: break

    if advice:
        return advice
    
    return "The AI Advisor is currently busy. Please try scanning again in a few minutes."
