import argparse
import json
import os
import sys
from pathlib import Path

from faster_whisper import WhisperModel


def main():
    parser = argparse.ArgumentParser(prog="carbon", description="Carbon local speech-to-text CLI")
    parser.add_argument("audio", help="audio/video file")
    parser.add_argument("--language", default=None, help="language code, e.g. ar or en; default: auto-detect")
    parser.add_argument("--model", default=os.getenv("CARBON_MODEL", "tiny"))
    parser.add_argument("--device", default=os.getenv("CARBON_DEVICE", "cpu"))
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()
    compute_type = os.getenv("CARBON_COMPUTE_TYPE", "int8" if args.device == "cpu" else "float16")
    model = WhisperModel(args.model, device=args.device, compute_type=compute_type)
    segments, info = model.transcribe(args.audio, language=args.language or None, vad_filter=True, condition_on_previous_text=False)
    rows = [{"start": s.start, "end": s.end, "text": s.text.strip()} for s in segments]
    result = {"text": " ".join(row["text"] for row in rows).strip(), "language": info.language, "segments": rows}
    print(json.dumps(result, ensure_ascii=False) if args.as_json else result["text"])


if __name__ == "__main__":
    main()
