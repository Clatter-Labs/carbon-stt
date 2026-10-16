import os
import shlex
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from faster_whisper import WhisperModel
from server.model_registry import as_dicts

MODEL_SIZE = os.getenv("CARBON_MODEL", "tiny")
DEVICE = os.getenv("CARBON_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("CARBON_COMPUTE_TYPE", "int8" if DEVICE == "cpu" else "float16")

app = FastAPI(title="Carbon STT Server", version="0.2.0")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)

class SpeechRequest(BaseModel):
    input: str
    model: str | None = None
    voice: str | None = None
    language: str | None = None
    response_format: str = "wav"

@app.get("/v1/models")
def models():
    return {"data": as_dicts()}

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE, "compute_type": COMPUTE_TYPE}

@app.post("/v1/audio/speech")
def speech(request: SpeechRequest):
    """Run an explicitly configured local TTS command.

    The command receives CARBON_TEXT, CARBON_OUTPUT, CARBON_VOICE, and
    CARBON_LANGUAGE. No TTS engine is assumed or bundled by the API image.
    """
    configured = os.getenv("CARBON_TTS_COMMAND")
    if not configured:
        raise HTTPException(status_code=501, detail="No TTS provider configured. Set CARBON_TTS_COMMAND.")
    suffix = "." + request.response_format.lstrip(".")
    output_path = Path(tempfile.gettempdir()) / f"carbon-tts-{uuid.uuid4().hex}{suffix}"
    env = os.environ.copy()
    env.update({"CARBON_TEXT": request.input, "CARBON_OUTPUT": str(output_path), "CARBON_VOICE": request.voice or "", "CARBON_LANGUAGE": request.language or ""})
    try:
        subprocess.run(shlex.split(configured), env=env, check=True, timeout=120)
        if not output_path.exists():
            raise HTTPException(status_code=502, detail="TTS provider did not create the requested output file.")
        return FileResponse(output_path, media_type=f"audio/{request.response_format}", filename=f"carbon-speech{suffix}")
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=504, detail="TTS provider timed out.") from error
    except subprocess.CalledProcessError as error:
        raise HTTPException(status_code=502, detail=f"TTS provider failed with exit code {error.returncode}.") from error

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
