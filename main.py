import os
import threading
import logging
from contextlib import asynccontextmanager
import urllib.request

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import torch
import torch.nn as nn
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

loaded_models = {}
model_locks = {}
lock_for_locks = threading.Lock()

class CharRNN(nn.Module):
    def __init__(self, vocab_size, hidden_size=256, num_layers=2):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, hidden_size)
        self.rnn = nn.RNN(hidden_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, vocab_size)
        self.hidden_size = hidden_size
        self.num_layers = num_layers

    def forward(self, x, hidden):
        x = self.embed(x)
        out, hidden = self.rnn(x, hidden)
        out = self.fc(out[:, -1, :])
        return out, hidden

@asynccontextmanager
async def lifespan(app: FastAPI):
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    os.makedirs(models_dir, exist_ok=True)
    yield
    loaded_models.clear()
    logger.info("Cleared loaded models on shutdown.")

app = FastAPI(lifespan=lifespan, title="PiNeurons API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    model_id: str = Field(..., description="The unique identifier for the model (without .pth)")
    model_url: str | None = Field(default=None, description="Optional URL to download the model from if not found locally")
    seed_phrase: str = Field(..., description="The initial text to seed the model generation")
    sequence_length: int = Field(default=50, ge=1, le=500, description="The lookback context window size")
    length: int = Field(default=300, ge=1, le=2000, description="Number of characters to generate")
    temperature: float = Field(default=0.6, gt=0.0, le=2.0, description="Sampling temperature")
    model_config = {'protected_namespaces': ()}

def get_model_lock(model_id: str) -> threading.Lock:
    with lock_for_locks:
        if model_id not in model_locks:
            model_locks[model_id] = threading.Lock()
        return model_locks[model_id]

def load_model(model_name: str, path: str):
    if not os.path.exists(path):
        logger.warning(f"Model path {path} does not exist.")
        return None
        
    try:
        checkpoint = torch.load(path, map_location=torch.device('cpu'), weights_only=False)
    except Exception as e:
        logger.error(f"Error loading torch checkpoint from {path}: {e}")
        raise e
    
    char2idx = checkpoint['char2idx']
    idx2char = checkpoint['idx2char']
    hidden_size = checkpoint['hidden_size']
    num_layers = checkpoint['num_layers']
    vocab_size = len(char2idx)
    
    model = CharRNN(vocab_size, hidden_size, num_layers)
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    model.eval()
    
    return {
        "model": model,
        "char2idx": char2idx,
        "idx2char": idx2char
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "loaded_models_count": len(loaded_models)}

@app.get("/models")
def get_models():
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    cached_models = []
    if os.path.exists(models_dir):
        for file in os.listdir(models_dir):
            if file.endswith(".pth"):
                model_id = file[:-4]
                cached_models.append({
                    "id": model_id,
                    "status": "loaded" if model_id in loaded_models else "cached"
                })
    return cached_models

def generate_text(model, seed, char2idx, idx2char, sequence_length=50, length=300, temperature=0.6):
    model.eval()
    chars_out = [ch for ch in seed.lower()]
    hidden = torch.zeros(getattr(model, 'num_layers', 2), 1, getattr(model, 'hidden_size', 256))
    
    with torch.no_grad():
        for _ in range(length):
            context = chars_out[-sequence_length:]
            seq = [char2idx.get(ch, 0) for ch in context]
            
            if not seq:
                seq = [0]
            
            seq_tensor = torch.tensor([seq], dtype=torch.long)
            output, hidden = model(seq_tensor, hidden)
            
            scaled_output = output / max(temperature, 1e-5)
            probs = torch.softmax(scaled_output, dim=1).cpu().numpy().ravel()
            
            probs = probs / np.sum(probs)
            
            next_idx = np.random.choice(len(probs), p=probs)
            chars_out.append(idx2char[next_idx])
    
    return ''.join(chars_out)

@app.post("/generate")
def generate(req: GenerateRequest):
    model_id = req.model_id
    model_url = req.model_url
    
    logger.info(f"Received generation request for model '{model_id}'")
    
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    model_path = os.path.join(models_dir, f"{model_id}.pth")
    
    lock = get_model_lock(model_id)
    with lock:
        if model_id not in loaded_models:
            if not os.path.exists(model_path):
                if not model_url:
                    logger.error("model_url is missing for unknown model.")
                    raise HTTPException(status_code=400, detail="model is not cached locally and model_url is required to fetch it.")
                
                try:
                    logger.info(f"Downloading model '{model_id}' from {model_url}...")
                    download_url = model_url.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/")
                    req_obj = urllib.request.Request(download_url, headers={'User-Agent': 'PiNeurons-Backend/1.0'})
                    with urllib.request.urlopen(req_obj, timeout=30) as response, open(model_path, 'wb') as out_file:
                        out_file.write(response.read())
                    logger.info(f"Successfully downloaded model '{model_id}'.")
                except Exception as e:
                    logger.error(f"Download failed for model {model_id}: {e}", exc_info=True)
                    raise HTTPException(status_code=500, detail=f"Failed to download model: {str(e)}")
            
            if model_id not in loaded_models:
                try:
                    logger.info(f"Loading model '{model_id}' into memory...")
                    loaded = load_model(model_id, model_path)
                    if loaded:
                        loaded_models[model_id] = loaded
                        logger.info(f"Successfully loaded model '{model_id}'.")
                    else:
                        raise Exception("load_model returned None.")
                except Exception as e:
                    logger.error(f"Failed to load model {model_id}: {e}", exc_info=True)
                    raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

    model_data = loaded_models[model_id]
    model = model_data["model"]
    char2idx = model_data["char2idx"]
    idx2char = model_data["idx2char"]

    try:
        generated_text = generate_text(
            model=model, 
            seed=req.seed_phrase,
            char2idx=char2idx,
            idx2char=idx2char,
            sequence_length=req.sequence_length, 
            length=req.length, 
            temperature=req.temperature
        )
    except Exception as e:
        logger.error(f"Text generation failed for model {model_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
    
    return {"response": generated_text}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    logger.info(f"Starting server at {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=debug)
