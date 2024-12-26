# TODO
# File untuk terima request & kirim respons ke Chrome Extension

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def read_root():
  return {"message": "Welcome to FastAPI"}