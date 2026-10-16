# Carbon /STT

**Carbon** is Clatter Labs Software's lightweight speech-to-text runtime for the web. It runs inference locally in the browser, uses WebGPU when available, falls back to WASM, and sends no audio to a backend.

> **Status:** v0.1 is a working browser runtime and reference implementation. It is not a newly trained Carbon checkpoint yet. The default checkpoint is the open-weight `onnx-community/whisper-tiny.en`, exposed behind a small Carbon API so a future Carbon checkpoint can replace it without changing the UI.

## What Carbon is

Carbon is the product/runtime layer around a small Transformer ASR checkpoint:

- **Fast path:** WebGPU + fp16 when the browser exposes `navigator.gpu`.
- **Portable path:** ONNX Runtime WASM + q8 when WebGPU is unavailable.
- **Private by default:** audio is decoded and transcribed in-browser; only model files are downloaded from Hugging Face on first use and then cached by the browser.
- **Simple surface:** upload an audio file or record from the microphone, then copy the transcript.
- **Replaceable weights:** change `MODEL` in `src/main.js` to a compatible Transformers.js/ONNX checkpoint.

The reference model is Whisper Tiny English, approximately 39M parameters. It stays below the project's 30M–1B target ceiling only if we later produce a smaller Carbon checkpoint; the current v0.1 reference is intentionally a practical starting point, not the final Carbon architecture.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Microphone capture requires a secure context (`localhost` is allowed) and browser permission.

```bash
npm test
npm run build
```

## Model and licensing

Carbon's wrapper is MIT licensed by Clatter Labs Software. The default Whisper weights and upstream code are released under MIT by OpenAI; the ONNX conversion is provided by the `onnx-community/whisper-tiny.en` model repository. Review the upstream model card and checkpoint terms before redistributing weights in a product.

- [Transformers.js](https://huggingface.co/docs/transformers.js/en/index)
- [Transformers.js v3 WebGPU ASR example](https://github.com/huggingface/blog/blob/main/transformersjs-v3.md)
- [OpenAI Whisper repository](https://github.com/openai/whisper)
- [Whisper Tiny model card](https://huggingface.co/openai/whisper-tiny)
- [Browser reference project](https://github.com/xenova/whisper-web)

## Roadmap to a real Carbon checkpoint

1. Define target languages, streaming latency, acceptable WER, and supported devices.
2. Benchmark `tiny.en`, `tiny`, `base.en`, and smaller student/distilled candidates on representative audio.
3. Select a legally distributable training corpus with consent and language coverage.
4. Distill or fine-tune a sub-30M student model; keep evaluation data and WER reports in-repo.
5. Export to ONNX, quantize q8/q4, validate WebGPU and WASM parity, and publish the checkpoint separately on Hugging Face.
6. Point `MODEL` to the Carbon checkpoint and record exact commit hashes in a release manifest.

## Important limitations

This demo is not a safety-critical transcription system. Whisper-family models can hallucinate, vary by language/accent, and are not a substitute for human review in legal, medical, employment, or other high-impact settings. Do not transcribe people without consent.

## Organization

Maintained by **Clatter Labs Software** in the **Clatter-Labs** GitHub organization. This project is not affiliated with OpenAI or Hugging Face.
