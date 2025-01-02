# File untuk proses text dari API
from transformers import AutoTokenizer, AutoModelForSequenceClassification  # type: ignore
import torch  # type: ignore
import torch.nn.functional as F

# Load kedua model dan tokenizer
model = AutoModelForSequenceClassification.from_pretrained("Exqrch/IndoBERTweet-HateSpeech")
tokenizer = AutoTokenizer.from_pretrained("indolem/indobertweet-base-uncased")

def analyze_text(text: str):
    """
    Analisis teks menggunakan model:
    - Hate Speech Detection

    Args:
        text (str): Teks yang akan dianalisis.

    Returns:
        dict: Hasil probabilitas untuk setiap kategori dari dua model.
    """
    # Tokenisasi dan prediksi
    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        
    logits = outputs.logits
    probabilities = F.softmax(logits, dim=-1)
    
    # Konversi probabilitas ke persen dan bulatkan ke 2 desimal
    not_hate_prob = round(probabilities[0][0].item() * 100, 2)  # Not Targeted Speech (%)
    hate_prob = round(probabilities[0][1].item() * 100, 2)  # Targeted Speech (%)

    return {
        "message": "Successfully Recognized TweetText",
        "result": {
            "hate_speech": hate_prob,
            "not_hate_speech": not_hate_prob,
            # Rata-rata probabilitas hate speech dan not hate speech (%)
            "score": round((hate_prob + not_hate_prob) / 2, 2)  
        }
    }
