import subprocess
import tempfile
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

PIPER_BIN = "/home/romeu/.local/bin/piper"
MODEL_PATH = "/home/romeu/piper/models/pt_BR-faber-medium.onnx"
CONFIG_PATH = "/home/romeu/piper/models/pt_BR-faber-medium.onnx.json"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/tts")
async def tts(payload: dict):
    text = payload.get("text", "").strip()

    if not text:
        return {"error": "Texto vazio"}

    # cria arquivo temporário
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
        wav_path = temp_wav.name

    # chama o Piper corretamente
    subprocess.run(
        [
            PIPER_BIN,
            "--model", MODEL_PATH,
            "--config", CONFIG_PATH,
            "--output_file", wav_path,
            "--text", text
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # lê o WAV gerado pelo Piper
    with open(wav_path, "rb") as f:
        audio_bytes = f.read()

    return Response(content=audio_bytes, media_type="audio/wav")


# ============================================================
# ⭐ HTTPS com mkcert (ADICIONE ESTE BLOCO)
# ============================================================

if __name__ == "__main__":
    import uvicorn
    import os

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    CERT_DIR = os.path.join(os.path.dirname(BASE_DIR), "certs")

    cert_file = os.path.join(CERT_DIR, "cert.pem")
    key_file = os.path.join(CERT_DIR, "key.pem")

    print("[TTS] HTTPS ativo em https://0.0.0.0:8001")
    print("[TTS] Cert:", cert_file)
    print("[TTS] Key:", key_file)

    uvicorn.run(
        "tts_server:app",
        host="0.0.0.0",
        port=8001,
        ssl_certfile=cert_file,
        ssl_keyfile=key_file,
    )
