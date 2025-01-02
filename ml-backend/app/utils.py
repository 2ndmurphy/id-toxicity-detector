# TODO
# File untuk simpan methods/function proses data dari api ke model

predictions = [
    {"id": 1, "toxicity": 0.002287372248247266},
    {"id": 2, "toxicity": 0.9994370341300964},
    {"id": 3, "toxicity": 0.4036000967025757},
]

# Set threshold lebih tinggi, misalnya 0.8
threshold = 0.4

for pred in predictions:
  is_toxic = pred["toxicity"] > threshold
  print(f"Tweet ID {pred['id']}: {'Toxic' if is_toxic else 'Non-Toxic'} (Score: {pred['toxicity']})")