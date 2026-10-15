import os
import subprocess
import tempfile

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Caminho do whisper.cpp (CPU)
WHISPER_CPP = "/home/romeu/whisper.cpp/build/bin/whisper-cli"
MODEL_PATH = "/home/romeu/whisper.cpp/models/ggml-large-v3.bin"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "engine": "whisper.cpp-cpu"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):

    wav_path = None

    try:
        # Salva o áudio temporário (UI já envia WAV)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            wav_path = temp_file.name
            temp_file.write(await audio.read())

        # Executa whisper.cpp
        result = subprocess.run(
            [
                WHISPER_CPP,
                "-m", MODEL_PATH,
                "-f", wav_path,
                "-otxt",
                "-l", "pt",
                "-t", "4"  # threads (ajuste conforme sua CPU)
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        text = result.stdout.strip()
        return {"text": text}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)


if __name__ == "__main__":
    import uvicorn
    import os

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    CERT_DIR = os.path.join(BASE_DIR, "certs")

    cert_file = os.path.join(CERT_DIR, "cert.pem")
    key_file = os.path.join(CERT_DIR, "key.pem")

    print("[SERVER] Whisper HTTPS em https://0.0.0.0:5000")
    print("[SERVER] Cert:", cert_file)
    print("[SERVER] Key:", key_file)

    uvicorn.run(
        "whisper_server:app",
        host="0.0.0.0",
        port=5000,
        ssl_certfile=cert_file,
        ssl_keyfile=key_file,
    )