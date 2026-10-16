# Carbon Providers

Carbon is a provider-neutral speech runtime. It does not force an application to adopt one model format, one vendor, or one deployment topology. The client calls Carbon's stable contracts while the server selects a provider at runtime.

## Stable capabilities

| Capability | Contract | Output |
|---|---|---|
| Speech-to-text | `POST /v1/audio/transcriptions` | text, language, segments, confidence when available |
| Text-to-speech | `POST /v1/audio/speech` | an audio stream in the requested format |
| Model metadata | `GET /v1/models` | provider, model, device, capabilities |
| Health | `GET /health` | runtime and provider readiness |

## Provider families

### In-process providers

Use these when the model library is installed in the Carbon image or Python environment. An in-process provider has direct access to audio bytes, model state, streaming cancellation, timestamps, and device configuration. The current reference STT server uses this pattern.

Future Carbon-native providers will implement the same interface and replace the reference model without changing the HTTP client.

### CLI providers

Use a CLI adapter for a local binary, desktop runtime, model daemon, or custom research checkpoint. Carbon passes explicit input/output paths and model options rather than assuming a vendor-specific API.

A CLI adapter should:

1. Accept an audio file or text input.
2. Return deterministic UTF-8 text or write an audio output file.
3. Return a non-zero exit status on failure.
4. Support cancellation and a configurable timeout.
5. Declare language, streaming, timestamp, and format capabilities.

See `server/providers.py` and `carbon.config.example.yaml`.

### HTTP providers

A deployment can point a provider at a local or cloud HTTP service. The Carbon API remains the front door, so an application does not need to know whether the underlying model runs in the same process, a Docker sidecar, a GPU host, or a managed endpoint.

## Local runtimes

- **Docker:** recommended portable packaging for the Carbon API and model cache.
- **LM Studio:** usable as a local text-model or custom command sidecar; Carbon remains the audio boundary unless an installed speech model exposes a compatible audio API.
- **Ollama:** usable as a local text-model sidecar or through a custom speech model/CLI adapter; Carbon does not assume that every Ollama model accepts audio.
- **Custom CLI:** supported through the command adapter and is the escape hatch for any local speech model.
- **Cloud:** run the same Carbon container behind a reverse proxy, GPU scheduler, or Kubernetes service.

## TTS boundary

TTS is optional and provider-driven. Carbon does not claim to ship a proprietary voice model in this repository. A TTS provider receives text, voice, and language, then returns audio. This lets users connect an open-weight local voice model, a CLI engine, or a cloud endpoint without coupling Carbon's STT path to it.

## Configuration rules

- Keep model IDs and provider credentials outside the browser bundle.
- Prefer local inference when audio sensitivity requires it.
- Record model, tokenizer, quantization, device, and provider versions in `/v1/models`.
- Do not present a third-party checkpoint as a Carbon-trained checkpoint.
- Benchmark WER/CER for STT and latency/RTF for TTS per language and device.
