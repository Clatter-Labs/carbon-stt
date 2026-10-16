"""Provider contracts for Carbon's local and remote speech model adapters.

Providers deliberately expose a small stable surface so clients do not depend on
one model family, vendor API, or runtime. A production deployment can register
its own adapter without changing the HTTP contract.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol


@dataclass
class Transcript:
    text: str
    language: str | None = None
    segments: list[dict] = field(default_factory=list)


class SpeechToTextProvider(Protocol):
    name: str

    def transcribe(self, audio_path: str | Path, *, language: str | None = None, prompt: str | None = None) -> Transcript:
        ...


class TextToSpeechProvider(Protocol):
    name: str

    def synthesize(self, text: str, output_path: str | Path, *, voice: str | None = None, language: str | None = None) -> Path:
        ...


class CommandSpeechProvider:
    """Adapter for any local CLI model.

    The command receives named environment variables and writes its result to
    the requested output path. This keeps Carbon independent of a particular
    local runtime such as a desktop app, a model daemon, or a custom binary.
    """

    def __init__(self, name: str, command: list[str]):
        self.name = name
        self.command = command

    def __repr__(self) -> str:
        return f"CommandSpeechProvider(name={self.name!r}, command={self.command!r})"
