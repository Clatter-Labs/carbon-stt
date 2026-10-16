import os
import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, UploadFile
from faster_whisper import WhisperModel
from server.model_registry import as_dicts

MODEL_SIZE = os.getenv("CARBON_MODEL", "tiny")
DEVICE = os.getenv("CARBON_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("CARBON_COMPUTE_TYPE", "int8" if DEVICE == "cpu" else "float16")

app = FastAPI(title="Carbon STT Server", version="0.2.0")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)

@app.get("/v1/models")
def models():
    return {"data": as_dicts()}

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE, "compute_type": COMPUTE_TYPE}

@app.post("/v1/audio/transcriptions")
async def transcriptions(
    file: Annotated[UploadFile, File(...)],
    language: Annotated[str | None, Form()] = None,
    prompt: Annotated[str | None, Form()] = None,
    response_format: Annotated[str, Form()] = "json",
):
    suffix = Path(file.filename or "audio.bin").suffix or ".bin"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as handle:
        handle.write(await file.read())
        audio_path = handle.name
    try:
        segments, info = model.transcribe(
            audio_path,
            language=language or None,
            initial_prompt=prompt or None,
            vad_filter=True,
            condition_on_previous_text=False,
        )
        items = [{"id": i, "start": s.start, "end": s.end, "text": s.text.strip()} for i, s in enumerate(segments)]
        text = " ".join(item["text"] for item in items).strip()
        if response_format == "text":
            return text
        return {"text": text, "language": info.language, "language_probability": info.language_probability, "segments": items}
    finally:
        Path(audio_path).unlink(missing_ok=True)
