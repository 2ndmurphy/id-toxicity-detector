# Hate Speech Detection API Documentation

## Overview
The Hate Speech Detection API provides endpoints for detecting hate speech in text. This API leverages a pre-trained BERT model fine-tuned for Indonesian text analysis. It is designed to be used by a Chrome Extension or other clients to analyze text and classify it as either "hate speech" or "non-hate speech."

---

## Base URL
```
http://<your_server_ip>:3000
```

---

## Endpoints

### 1. **Root Endpoint**
#### Description:
Check if the API is running.

#### Request:
- **Method:** `GET`
- **URL:** `/`

#### Response:
- **Status Code:** `200 OK`
- **Body:**
```json
{
  "message": "Hate Speech Detection API is running!"
}
```

---

### 2. **Detect Toxicity**
#### Description:
Analyze a piece of text to determine the probability of it being hate speech or non-hate speech.

#### Request:
- **Method:** `POST`
- **URL:** `/detect-toxicity`
- **Headers:**
  - `Content-Type: application/json`
- **Body:**
```json
{
  "text": "<text_to_analyze>"
}
```

#### Response:
- **Status Code:**
  - `200 OK` if the request is successful.
  - `400 Bad Request` if the request body is invalid.
  - `500 Internal Server Error` if something goes wrong on the server.
- **Body (Success):**
```json
{
  "hate_speech": <probability>,
  "non_hate_speech": <probability>
}
```

#### Example:
##### Request:
```json
{
  "text": "wah keren banget opini lu bang sangat intuitif dan bermanfaat @user123ahoyy"
}
```

##### Response:
```json
{
  "hate_speech": 0.448,
  "non_hate_speech": 0.551
}
```

---

## Error Handling

### 1. **400 Bad Request**
Occurs when the input data is invalid or missing.
#### Example Response:
```json
{
  "detail": "Text cannot be empty"
}
```

### 2. **500 Internal Server Error**
Occurs when there is an issue on the server.
#### Example Response:
```json
{
  "detail": "Internal Server Error: <error_message>"
}
```

---

## Development Notes

### Folder Structure
```
project_root/
├── app/
│   ├── main.py       # API logic (FastAPI implementation)
│   └── requirements.txt # Dependencies
├── model/
│   ├── model.py      # Model loading and analysis logic
│   └── tokenizer/    # Tokenizer files (if applicable)
└── tests/
    └── test_api.py   # Unit tests for API
```

### Environment Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # For Linux/Mac
   venv\Scripts\activate   # For Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   uvicorn app.api:app --host 0.0.0.0 --port 3000
   ```

### Testing with Postman
1. Use the provided endpoints.
2. Ensure `Content-Type: application/json` is set in the headers.
3. Send requests with the required payload.

---

## Future Improvements
1. Add authentication (e.g., API keys) for secure access.
2. Enhance error handling with detailed logs.
3. Deploy the API on a cloud platform (e.g., AWS, GCP, or Azure).
4. Optimize model loading and inference for better performance.

---

## Contact
For questions or issues, contact the development team at `jibrilroihan@gmail.com`.