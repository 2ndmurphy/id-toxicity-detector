import os, sys

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'model')))
from model import analyze_text

# Inisialisasi FastAPI
app = FastAPI()

# Schema untuk validasi input
class TextInput(BaseModel):
    text: str

@app.post("/detect-toxicity")
async def detect_toxicity(input: TextInput):
    """
    Endpoint untuk menganalisis teks menggunakan model:
    - Hate Speech Detection

    Args:
      input (TextInput): Input teks dalam format JSON.

    Returns:
      JSONResponse: Hasil analisis teks.
    """
    try:
        # Analisis teks menggunakan model
        result = analyze_text(input.text)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/")
async def read_root():
  """
  Endpoint root untuk mengecek status API.
  """
  return {"message": "Hate Speech Detection API is running!"}

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("api:app", host="0.0.0.0", port=3000, reload=True)
