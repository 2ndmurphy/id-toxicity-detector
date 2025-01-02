import torch
import torch.nn.functional as F
from typing import List
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# Higher TEMPERATURE : Uncertain model or Softer Probabilities
# Lower TEMPERATURE : Confident model or Sharp Probabilities
TEMPERATURE: float = 4.0

class HateSpeechModel:
    def __init__(self, model_name: str, tokenizer_name: str):
        self.model = None
        self.tokenizer = None
        try:
            self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
            self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)
            print(f"Model and tokenizer loaded successfully: {model_name}")
        except Exception as e:
            print(f"Error loading model or tokenizer: {e}")

    def is_model_loaded(self) -> bool:
        return self.model is not None and self.tokenizer is not None

    def predict_batch(self, texts: List[str]) -> List[float]:
        inputs = self.tokenizer(texts, padding=True, truncation=True, return_tensors="pt")

        with torch.no_grad():
            output = self.model(**inputs)

        logits = output.logits
        probabilities = self._apply_temperature_scaling(logits)

        # Extract probabilities of the "hate speech" class (index 1)
        return [prob[1].item() for prob in probabilities]

    def predict_single(self, text: str) -> float:
        return self.predict_batch([text])[0]

    def _apply_temperature_scaling(self, logits: torch.Tensor) -> torch.Tensor:
        scaled_logits = logits / TEMPERATURE
        return F.softmax(scaled_logits, dim=-1)
