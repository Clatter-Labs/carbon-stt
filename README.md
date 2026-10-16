# Carbon /STT

<p align="center"><img src="assets/carbon-logo.svg" width="96" alt="Carbon logo"></p>

**Carbon** is Clatter Labs Software's fast, private speech-to-text platform for the web and local servers. It is developed and maintained inside the **Clatter-Labs** GitHub organization.

> **Status:** Carbon v0.2 contains a working browser runtime, a local CLI, and a Docker API server. The public reference runtime can execute a multilingual open checkpoint today. The owned Carbon architecture and training program are specified in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); the first Carbon-trained checkpoint will be published only after reproducible evaluation.

## Official OSS project page

The canonical OSS project page is [oss.clatterlabs.com/project/carbon](https://oss.clatterlabs.com/project/carbon). It records Carbon as a Clatter Labs MIT library in beta and tracks the owned model architecture, language targets, deployment goals, and release roadmap.

## Product definition

Carbon is not a hosted transcription proxy. It is a portable ASR stack with a Node.js model runtime that can run beside a browser UI, on a developer laptop, in a Docker container, or as a self-managed CLI server.

- **Browser UI:** captures or uploads audio and sends it to the local Node.js runtime; it does not load the model.
- **Server:** FastAPI plus `faster-whisper` today; a Carbon-native inference engine will replace the reference backend when the first owned checkpoint is ready.
- **CLI:** direct local transcription with language selection and JSON output.
- **Deployment:** Docker Compose, process managers, reverse proxies, or any server that can run Python.
- **Privacy:** audio stays inside the selected local Node.js or server execution environment.
- **Languages:** Arabic and English are first-class targets, with a multilingual interface for other widely used languages.

## Carbon-owned model direction

The Carbon model is intended to be an original Clatter Labs checkpoint, trained and evaluated by Clatter Labs. It will use a compact streaming acoustic encoder, residual time-channel blocks, multilingual subword outputs, and a CTC-compatible decoding path. The architecture is designed for predictable latency and efficient export to ONNX/WebGPU rather than for large parameter counts.

The current browser reference checkpoint is a compatibility backend, not the final Carbon model. Keeping that distinction explicit prevents us from claiming training work that has not happened yet. The `MODEL` constant in `src/main.js` is the replacement point for the first Carbon checkpoint.

## Supported languages

The UI provides automatic detection and explicit selection for Arabic, English, French, Spanish, Portuguese, Bengali, Hindi, Urdu, Chinese, Japanese, Korean, Russian, Indonesian, German, Turkish, and Italian. The model family can cover additional languages, but accuracy depends on data coverage, dialect, microphone quality, and background noise. Carbon's evaluation plan will report WER/CER separately for Arabic varieties and English accents instead of hiding them in one aggregate score.

## Local development

```bash
npm install
npm run dev
npm test
npm run build
```

The browser UI requires a secure context for microphone access; `localhost` is allowed by modern browsers. `npm run dev` starts Vite and the Carbon Node runtime together.

## Node.js model runtime

```bash
npm install
npm run dev
```

The Node runtime loads the configured model once and stores model files in `.carbon-cache/`. Change the model or cache location without changing the browser client:

```bash
CARBON_MODEL=onnx-community/whisper-tiny \
CARBON_CACHE_DIR=$HOME/.cache/carbon \
npm run node:start
```

The browser proxies `/api/transcribe` to the Node runtime on port `8787`. Audio is decoded to mono 16 kHz PCM inside Node using the bundled `ffmpeg-static` binary before inference.

## Docker API server

```bash
./deploy/carbonctl.sh up
./deploy/carbonctl.sh health
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F file=@sample.wav \
  -F language=ar
```

The server exposes an portable transcription contract without requiring a cloud provider:

```text
POST /v1/audio/transcriptions
multipart/form-data: file, language?, prompt?, response_format?
```

The default container uses CPU/int8 and caches model files in a persistent Docker volume. On a CUDA host, configure `CARBON_DEVICE=cuda` and `CARBON_COMPUTE_TYPE=float16` with a CUDA-compatible image.

## Direct CLI

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r server/requirements.txt
python -m server.cli recording.wav --language ar
python -m server.cli recording.wav --language en --json
```

## Ollama, LM Studio, and other local servers

Carbon owns the audio-to-text boundary. Ollama and LM Studio can be run beside Carbon as optional text-processing services for cleanup, summaries, extraction, or assistant workflows. Carbon does not pretend that a general text-generation endpoint is an audio transcription engine.

The stable boundary is Carbon's `/v1/audio/transcriptions` endpoint. This makes Carbon deployable behind Docker Compose, Nginx, Caddy, systemd, Kubernetes, or any CLI process manager. The output can then be forwarded to any local text model server without coupling the ASR engine to one vendor.

## Repository layout

```text
src/                 Browser runtime and UI
assets/              Carbon logo and static assets
server/app.py        HTTP transcription API
server/cli.py        Local command-line transcription
deploy/carbonctl.sh  Docker lifecycle helper
docker-compose.yml   Portable local deployment
Dockerfile           Reproducible API image
docs/ARCHITECTURE.md Carbon-owned model specification
```

## License and model provenance

The Carbon application code and deployment glue in this repository are MIT licensed by Clatter Labs Software. The reference checkpoint is a third-party compatibility artifact and is not presented as a Carbon-trained model. Its original model card and license must be reviewed before redistribution. Carbon-trained weights will ship with a separate model card, dataset statement, evaluation report, and exact release hash.

## Limitations

Carbon is not a safety-critical transcription system. Outputs can contain recognition errors or hallucinations and must be reviewed in medical, legal, employment, accessibility, or other high-impact workflows. Do not record or transcribe people without consent.

## Organization

Maintained by **Clatter Labs Software** in the **Clatter-Labs** GitHub organization. Carbon is an independent Clatter Labs project with its own runtime, deployment surface, evaluation plan, and future checkpoint.

## Provider-neutral speech library

Carbon is now organized as a provider-neutral runtime for both speech-to-text and optional text-to-speech. The public API stays stable while the implementation can be an in-process model, a local CLI, a Docker sidecar, a local desktop runtime, or a cloud endpoint.

- `POST /v1/audio/transcriptions` is the STT contract.
- `POST /v1/audio/speech` is the optional TTS contract for a configured provider.
- `GET /v1/models` reports loaded provider, modality, languages, streaming support, and device.
- `server/providers.py` defines the small adapter surface.
- `carbon.config.example.yaml` shows how to attach a custom local TTS or STT command.

Carbon does not bundle a proprietary TTS model in this repository. TTS is an adapter capability: users can attach any compatible open-weight local model, CLI engine, Docker service, or cloud endpoint without changing the Carbon client.
