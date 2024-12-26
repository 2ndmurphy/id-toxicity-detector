# TODO
# File untuk proses text dari API

# Testing
from transformers import AutoTokenizer, AutoModel # type: ignore

import torch # type: ignore

if __name__ == "__main__":
    tokenizer = AutoTokenizer.from_pretrained("indolem/indobertweet-base-uncased")
    model = AutoModel.from_pretrained("indolem/indobertweet-base-uncased")
    
    text = "Bagus banget filmnya! @USER suka HTTPURL"

    inputs = tokenizer(text, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)

    print(type(outputs))
    print(outputs.keys())
    print(outputs.last_hidden_state.shape)
    print(outputs.pooler_output.shape)

    cls_embedding = outputs.last_hidden_state[0, 0, :]
    print(cls_embedding.shape)
