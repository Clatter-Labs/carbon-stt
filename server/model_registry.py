from dataclasses import asdict, dataclass
import os


@dataclass(frozen=True)
class ModelDescriptor:
    id: str
    modality: str
    provider: str
    languages: tuple[str, ...]
    streaming: bool
    device: str


def registry() -> list[ModelDescriptor]:
    return [
        ModelDescriptor(
            id=os.getenv("CARBON_MODEL", "tiny"),
            modality="speech-to-text",
            provider="faster-whisper",
            languages=("ar", "en", "multilingual"),
            streaming=False,
            device=os.getenv("CARBON_DEVICE", "cpu"),
        )
    ]


def as_dicts() -> list[dict]:
    return [asdict(model) for model in registry()]
