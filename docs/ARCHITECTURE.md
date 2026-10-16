# Carbon Model Architecture

## Goal

Carbon is a Clatter Labs-owned multilingual automatic speech recognition model for fast local inference. The target is a compact model that is useful on modern browsers and modest CPU servers, not a large general-purpose language model.

The first owned checkpoint targets Arabic and English, then expands to other high-coverage languages after the evaluation harness is stable. The model must remain below 30M trainable parameters for the initial student configuration and must export cleanly to ONNX.

## Design principles

1. **Streaming first.** The encoder must process short audio windows with bounded state so partial transcripts can be emitted without waiting for an entire recording.
2. **Convolutional efficiency.** Residual one-dimensional time-channel blocks provide local context, predictable memory use, and good accelerator fusion.
3. **Explicit multilingual behavior.** The tokenizer, language conditioning, and evaluation sets must represent Arabic script, Latin script, code-switching, and common diacritics behavior.
4. **Web-compatible decoding.** Greedy CTC decoding is the baseline. Optional shallow fusion or a small language-model rescoring pass must never be required for basic operation.
5. **Reproducibility.** Every released weight file is paired with a dataset statement, preprocessing version, tokenizer hash, training configuration, and WER/CER report.

## Proposed network

```text
16 kHz mono PCM
  -> pre-emphasis and 80-bin log-mel features
  -> 2x lightweight temporal subsampling
  -> Carbon residual time-channel encoder
       - depthwise/separable 1D convolution
       - pointwise channel projection
       - normalization and gated activation
       - residual skip connection
       - optional dilated context block
  -> language-conditioned projection
  -> CTC vocabulary logits
  -> greedy or beam decoder
```

The encoder uses residual blocks inspired by efficient streaming acoustic models, but Carbon is not a checkpoint fork. Block count, widths, dilation schedule, tokenizer, data mixture, and training recipe are Carbon-specific and will be versioned in this repository.

## Initial size budget

| Component | Target |
|---|---:|
| Feature frontend | deterministic, no trainable parameters |
| Encoder blocks | 8–12 |
| Hidden width | 192–256 channels |
| Vocabulary | multilingual subword vocabulary |
| Trainable parameters | <30M for Carbon-S |
| Quantized deployment | int8 CPU and WebGPU-friendly ONNX |
| Streaming chunk | 1–5 seconds with configurable overlap |

These are design targets, not measured claims. The first training run must publish exact parameter counts and latency on representative browser and CPU hardware.

## Arabic and English requirements

The training and evaluation split must include Modern Standard Arabic, Gulf, Egyptian, Levantine, and Maghrebi speech where licensing permits. English must include multiple accents and realistic conversational audio. The data pipeline must preserve Arabic letters, normalize only documented orthographic variants, and measure both normalized and strict text scores.

The benchmark will report:

- WER for English and Arabic separately.
- CER for Arabic and mixed-script utterances.
- Language identification accuracy.
- Code-switching subsets.
- Real-time factor on CPU and WebGPU.
- Cold-start model download and warm-cache latency.

## Training path

1. Select consented, redistributable speech data and publish a dataset manifest.
2. Train the acoustic encoder with multilingual CTC supervision.
3. Add augmentation for noise, reverberation, speed, and microphone response.
4. Distill from a stronger teacher only when the teacher data and license allow it; the released Carbon checkpoint remains the owned artifact.
5. Export PyTorch to ONNX and validate numerical parity.
6. Quantize int8 and measure accuracy deltas per language.
7. Integrate the checkpoint into the browser runtime and Docker server.
8. Publish a model card with limitations, intended use, and reproducible evaluation.

## Runtime contract

The model adapter must expose:

```ts
type CarbonTranscript = {
  text: string;
  language?: string;
  segments?: Array<{ start: number; end: number; text: string }>;
};
```

The adapter must support automatic language detection, an explicit language hint, cancellation, chunked audio, and deterministic JSON output. The model ID remains configurable so the reference backend can be replaced by a Carbon checkpoint without changing clients.

## What is not claimed yet

This document is a build specification. It does not claim that a Carbon-trained checkpoint, Arabic WER result, or sub-30M production model already exists. Those claims become valid only when the corresponding weights, evaluation artifacts, and release metadata are committed.
