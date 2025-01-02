# Machine Learning Backend

A Python backend for processing tweets using a fine-tuned Hugging Face model, served via an API.

## Features
- Processes tweets to identify hate speech and toxic content.
- Powered by [IndoBERTweet-HateSpeech](https://huggingface.co/Exqrch/IndoBERTweet-HateSpeech) models.

## API Documentation
- Visit the API docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## Prerequisites
- Install the [uv](https://docs.astral.sh/uv/) package manager.

## How to Run the API Service

1. Sync or install dependencies:
    ```bash
    uv sync
    ```

2. Activate the virtual environment:
    - Windows (Command Prompt):
      ```bash
      .venv\Scripts\activate
      ```
    - Windows (Bash):
      ```bash
      source .venv/Scripts/activate
      ```
    - macOS/Linux:
      ```bash
      source .venv/bin/activate
      ```

3. Run the server:
    ```bash
    uv run main.py
    ```
    - You need to download the model first (if not already installed).
    - Wait for the message `Application startup complete`.

## Credits
- [IndoBERTweet-HateSpeech](https://huggingface.co/Exqrch/IndoBERTweet-HateSpeech)
- [IndoBERTweet Base Uncased](https://huggingface.co/indolem/indobertweet-base-uncased)
- [IndoToxic2024 Dataset](https://huggingface.co/datasets/Exqrch/IndoToxic2024)
