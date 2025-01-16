from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from model import HateSpeechModel

app = FastAPI()

MODEL_NAME = "Exqrch/IndoBERTweet-HateSpeech"
TOKENIZER_NAME = "indolem/indobertweet-base-uncased"

hate_speech_model = HateSpeechModel(MODEL_NAME, TOKENIZER_NAME)

class TweetList(BaseModel):
    id: int
    tweetText: str

class ApiResponseList(BaseModel):
    id: int
    toxicity: float

class TweetSingle(BaseModel):
    tweetText: str

class ApiResponseSingle(BaseModel):
    toxicity: float

@app.post("/analyze_tweets", response_model=List[ApiResponseList])
async def analyze_tweets_batch(tweets: List[TweetList]):
    """
    Analyzes a batch of tweets and returns hate speech probabilities for each.
    """
    if not hate_speech_model.is_model_loaded():
        raise HTTPException(status_code=500, detail="Model or tokenizer not loaded.")

    texts = [tweet.tweetText for tweet in tweets]
    try:
        probabilities = hate_speech_model.predict_batch(texts)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    responses = [
        ApiResponseList(id=tweet.id, toxicity=probabilities[i]) for i, tweet in enumerate(tweets)
    ]
    return responses

@app.post("/analyze_tweet", response_model=ApiResponseSingle)
async def analyze_tweet_single(tweet: TweetSingle):
    """
    Analyzes a single tweet and returns the hate speech probability.
    """
    if not hate_speech_model.is_model_loaded():
        raise HTTPException(status_code=500, detail="Model or tokenizer not loaded.")

    try:
        hate_prob = hate_speech_model.predict_single(tweet.tweetText)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return ApiResponseSingle(toxicity=hate_prob)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", reload=True, host="127.0.0.1", port=8000)
