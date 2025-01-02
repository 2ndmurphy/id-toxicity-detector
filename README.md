# Chrome Extension and Machine Learning Backend

This project integrates a Chrome extension for scraping tweets and highlighting toxic content with a Python backend that uses a machine learning model to process the tweets.

## Features
- **Chrome Extension**:
  - Scrapes tweets directly from Twitter.
  - Highlights toxic tweets.
  - Analyze toxicity of your tweet.
- **Python Backend**:
  - Processes tweets using [IndoBERTweet-HateSpeech](https://huggingface.co/Exqrch/IndoBERTweet-HateSpeech) model for hate speech detection.
  - Serves results via an API.

---

## How to Use

### 1. Set Up the Chrome Extension

1. Download and unzip `extension.zip`.
2. Open Chrome and navigate to [chrome://extensions/](chrome://extensions/).
3. Enable `Developer Mode`.
4. Click `Load unpacked` and select the extracted folder.
5. Activate the extension.

---

### 2. Run the Python Backend

1. Ensure the [uv](https://docs.astral.sh/uv/) package manager is installed.
2. Navigate to the backend folder
    ```bash
    cd ml-backend/
    ```
3. Sync dependencies:
    ```bash
    uv sync
    ```
3. Activate the virtual environment:
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
4. Run the server:
    ```bash
    uv run main.py
    ```

---

## Credits
- [create-chrome-extension](https://github.com/getvictor/create-chrome-extension) for the Chrome extension template.
- [Hugging Face Models](https://huggingface.co/) for providing models and datasets.
    - [IndoBERTweet-HateSpeech](https://huggingface.co/Exqrch/IndoBERTweet-HateSpeech)
    - [IndoBERTweet Base Uncased](https://huggingface.co/indolem/indobertweet-base-uncased)
    - [IndoToxic2024 Dataset](https://huggingface.co/datasets/Exqrch/IndoToxic2024)

## Citations

1. IndoToxic2024 Dataset:
    ```bibtex
    @article{susanto2024indotoxic2024,
          title={IndoToxic2024: A Demographically-Enriched Dataset of Hate Speech and Toxicity Types for Indonesian Language},
          author={Lucky Susanto and Musa Izzanardi Wijanarko and Prasetia Anugrah Pratama and Traci Hong and Ika Idris and Alham Fikri Aji and Derry Wijaya},
          year={2024},
          eprint={2406.19349},
          archivePrefix={arXiv},
          primaryClass={cs.CL},
          url={https://arxiv.org/abs/2406.19349},
    }
    ```

2. IndoBERTweet:
    ```bibtex
    @inproceedings{koto2021indobertweet,
      title={IndoBERTweet: A Pretrained Language Model for Indonesian Twitter with Effective Domain-Specific Vocabulary Initialization},
      author={Fajri Koto and Jey Han Lau and Timothy Baldwin},
      booktitle={Proceedings of the 2021 Conference on Empirical Methods in Natural Language Processing (EMNLP 2021)},
      year={2021}
    }
    ```
