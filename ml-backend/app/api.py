import sys
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Tambahin path buat akses module `model`
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'model')))
from model import load_model, analyze_text

# Inisialisasi FastAPI
app = FastAPI()

#! Do not touch: Schema untuk validasi input
class TextInput(BaseModel):
  text: str

# Endpoint untuk analisis hate speech
@app.post("/detect-toxicity")
async def detect_toxicity(request: Request):
  try:
    # Parse JSON dari request
    data = await request.json()
    if not data or 'text' not in data:
      raise HTTPException(status_code=400, detail="Text cannot be empty")
    text = data['text']
    result = analyze_text(model, tokenizer, text)

    return JSONResponse(content=result, status_code=200)
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# Root endpoint
@app.get("/")
async def read_root():
  return {"message": "Hate Speech Detection API is running!"}

# Main entry point
if __name__ == "__main__":
  import uvicorn
  model, tokenizer = load_model()
  uvicorn.run(app, host='0.0.0.0', port=3000)