# PiNeurons Backend

A production-ready PyTorch-based text generation API built with FastAPI. It dynamically loads, manages, and executes RNN language models to generate text based on input seed phrases.

## Features

- **FastAPI-powered**: High performance and asynchronous request handling.
- **Dynamic Model Loading**: Can fetch models remotely using `model_url` or load from the local `models/` directory securely.
- **Thread-safe**: Implements locks so multiple generate requests for the same model wait for it to be loaded only once without race conditions.
- **Production-Ready**: Includes centralized logging, configurable endpoints, robust CORS policy, and error handling.
- **Docker-ready**: Designed to be stateless and scaled horizontally where needed.

## Running the Application (Development)

Run the server with Uvicorn (already setup within `main.py` context or via CLI):
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The API should now be accessible at `http://localhost:8000`.

## Running the Application (Production)

For production, it is highly recommended to run using Gunicorn alongside Uvicorn workers:

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
*Adjust the number of workers (`-w`) according to the core count of your server.*

## Model Configuration
Models are stored as PyTorch `.pth` dictionaries. The backend expects models initialized with a `CharRNN` instance. 

