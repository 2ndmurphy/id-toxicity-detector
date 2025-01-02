from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from model import HateSpeechModel

app = FastAPI()

MODEL_NAME = "Exqrch/IndoBERTweet-HateSpeech"
TOKENIZER_NAME = "indolem/indobertweet-base-uncased"

hate_speech_model = HateSpeechModel(MODEL_NAME, TOKENIZER_NAME)

class TweetBuffer(BaseModel):
    id: int
    tweetText: str

class ApiResponse(BaseModel):
    id: int
    toxicity: float

class SingleTweetInput(BaseModel):
    tweetText: str

class SingleTweetResponse(BaseModel):
    toxicity: float

@app.post("/analyze_tweets", response_model=List[ApiResponse])
async def analyze_tweets_batch(tweets: List[TweetBuffer]):
    if not hate_speech_model.is_model_loaded():
        raise HTTPException(status_code=500, detail="Model or tokenizer not loaded.")

    texts = [tweet.tweetText for tweet in tweets]
    try:
        probabilities = hate_speech_model.predict_batch(texts)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    responses = [
        ApiResponse(id=tweet.id, toxicity=probabilities[i]) for i, tweet in enumerate(tweets)
    ]
    return responses

@app.post("/analyze_tweet", response_model=SingleTweetResponse)
async def analyze_tweet_single(tweet: SingleTweetInput):
    if not hate_speech_model.is_model_loaded():
        raise HTTPException(status_code=500, detail="Model or tokenizer not loaded.")

    try:
        hate_prob = hate_speech_model.predict_single(tweet.tweetText)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return SingleTweetResponse(toxicity=hate_prob)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", reload=True, host="127.0.0.1", port=8000)
