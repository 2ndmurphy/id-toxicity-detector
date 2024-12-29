# TODO
#? File untuk proses text dari API

# Testing
from transformers import AutoTokenizer, AutoModelForSequenceClassification # type: ignore

import torch # type: ignore

def load_model():
    tokenizer = AutoTokenizer.from_pretrained("indolem/indobertweet-base-uncased")
    model = AutoModelForSequenceClassification.from_pretrained("indolem/indobertweet-base-uncased")

    return model, tokenizer

def analyze_text(model, tokenizer, text):    
    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits
    probabilities = torch.nn.functional.softmax(logits, dim=-1).tolist()[0]

    return {"message": "Succesfully Recognize Hate Speech","hate_speech": probabilities[1], "non_hate_speech": probabilities[0]}
